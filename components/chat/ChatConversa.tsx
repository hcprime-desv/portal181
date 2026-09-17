"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Send, FileText, Mic, Trash2, MapPin, Square, User, Headphones } from "lucide-react";
import { subscribeMensagens, enviarMensagem, enviarMidia, enviarLocalizacao, criarAtendimento } from "@/lib/chatClient";
import type { Atendimento, Mensagem } from "@/types/chat";
import styles from "./ChatWidget.module.css";

interface ChatConversaProps {
  // null = ainda não existe nenhum atendimento — a 1ª mensagem/anexo
  // enviado cria um automaticamente (igual abrir uma conversa nova no
  // WhatsApp), sem formulário antes. Mesmo padrão de
  // hcpesquisa/ConversaAtendimento.tsx, portado de React Native pra web.
  atendimento: Atendimento | null;
  visitante: { id: string; nome: string };
  assuntoPadrao: string;
  onAtendimentoCriado: (atendimento: Atendimento) => void;
  mensagemBoasVindas?: string;
}

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// `attachment.src` de uma localização é sempre "lat,lng" puro (ver
// lib/chatClient.ts#enviarLocalizacao, mesmo formato do hcpesquisa).
function parseCoordenadas(src: string): { lat: number; lng: number } | null {
  const [latStr, lngStr] = src.split(",");
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

// Embed do OpenStreetMap — sem chave de API (o projeto não tem uma do
// Google Maps configurada aqui), funciona em qualquer implantação sem
// configuração extra.
function urlMapaEmbed(lat: number, lng: number): string {
  const delta = 0.006;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export default function ChatConversa({
  atendimento,
  visitante,
  assuntoPadrao,
  onAtendimentoCriado,
  mensagemBoasVindas,
}: ChatConversaProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviandoAnexo, setEnviandoAnexo] = useState(false);
  const [enviandoLocalizacao, setEnviandoLocalizacao] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  // Gravação de áudio (MediaRecorder) — mesmo destino do anexo de
  // arquivo (enviarMidia), só muda de onde vem o File. Ao parar de
  // gravar, cai numa prévia local (não sobe pro Storage ainda) — só
  // depois de confirmar em "Enviar" é que sai do aparelho, dando chance
  // de apagar e regravar.
  const [gravando, setGravando] = useState(false);
  const [duracaoGravacao, setDuracaoGravacao] = useState(0);
  const [previaAudio, setPreviaAudio] = useState<{ blob: Blob; url: string; duracao: number } | null>(null);
  const [enviandoAudio, setEnviandoAudio] = useState(false);
  const [erroGravacao, setErroGravacao] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!atendimento?.id) {
      setMensagens([]);
      return;
    }
    const unsub = subscribeMensagens(atendimento.id, setMensagens);
    return () => unsub();
  }, [atendimento?.id]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  // Libera o microfone se o painel fechar (componente desmonta) no meio
  // de uma gravação — sem isso o navegador continua com o ícone de
  // "microfone em uso" mesmo com o chat fechado.
  useEffect(() => {
    return () => pararStreamETimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A URL da prévia é criada com URL.createObjectURL — some sozinha se
  // não revogar (memória presa no navegador até fechar a aba).
  useEffect(() => {
    return () => {
      if (previaAudio) URL.revokeObjectURL(previaAudio.url);
    };
  }, [previaAudio]);

  function pararStreamETimer() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function garantirAtendimento(assuntoSugerido: string): Promise<Atendimento> {
    if (atendimento) return atendimento;
    const novo = await criarAtendimento(visitante, assuntoSugerido.trim().slice(0, 150) || assuntoPadrao);
    onAtendimentoCriado(novo);
    return novo;
  }

  async function handleEnviarTexto() {
    const corpo = texto.trim();
    if (!corpo) return;
    setTexto("");
    setEnviando(true);
    try {
      const alvo = await garantirAtendimento(corpo);
      await enviarMensagem(alvo, visitante, corpo);
    } catch (e) {
      console.error("Erro ao enviar mensagem:", e);
    } finally {
      setEnviando(false);
    }
  }

  async function handleSelecionarArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setEnviandoAnexo(true);
    try {
      const alvo = await garantirAtendimento(file.name);
      await enviarMidia(alvo, visitante, file);
    } catch (err) {
      console.error("Erro ao enviar anexo:", err);
    } finally {
      setEnviandoAnexo(false);
    }
  }

  async function handleEnviarLocalizacao() {
    setErroGravacao(null);
    if (!navigator.geolocation) {
      setErroGravacao("Seu navegador não suporta compartilhar localização.");
      return;
    }
    setEnviandoLocalizacao(true);
    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        try {
          const alvo = await garantirAtendimento("Localização");
          await enviarLocalizacao(alvo, visitante, {
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
          });
        } catch (err) {
          console.error("Erro ao enviar localização:", err);
          setErroGravacao("Não foi possível enviar a localização. Tente novamente.");
        } finally {
          setEnviandoLocalizacao(false);
        }
      },
      (err) => {
        console.error("Erro ao obter localização:", err);
        setErroGravacao("Não foi possível acessar sua localização. Verifique a permissão do navegador.");
        setEnviandoLocalizacao(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function iniciarGravacao() {
    setErroGravacao(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setErroGravacao("Seu navegador não suporta gravação de áudio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setGravando(true);
      setDuracaoGravacao(0);
      timerRef.current = setInterval(() => setDuracaoGravacao((d) => d + 1), 1000);
    } catch (e) {
      console.error("Erro ao acessar microfone:", e);
      setErroGravacao("Não foi possível acessar o microfone. Verifique a permissão do navegador.");
    }
  }

  function cancelarGravacao() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    pararStreamETimer();
    chunksRef.current = [];
    setGravando(false);
    setDuracaoGravacao(0);
  }

  async function pararGravacao() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setGravando(false);
    pararStreamETimer();

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
      recorder.stop();
    });
    chunksRef.current = [];
    if (blob.size === 0) {
      setDuracaoGravacao(0);
      return;
    }
    setPreviaAudio({ blob, url: URL.createObjectURL(blob), duracao: duracaoGravacao });
    setDuracaoGravacao(0);
  }

  function apagarPreviaAudio() {
    if (previaAudio) URL.revokeObjectURL(previaAudio.url);
    setPreviaAudio(null);
  }

  async function enviarAudioGravado() {
    if (!previaAudio) return;
    const { blob } = previaAudio;
    const extensao = (blob.type.split("/")[1] || "webm").split(";")[0];
    const file = new File([blob], `audio-${Date.now()}.${extensao}`, { type: blob.type });
    setEnviandoAudio(true);
    try {
      const alvo = await garantirAtendimento("Áudio");
      await enviarMidia(alvo, visitante, file);
      URL.revokeObjectURL(previaAudio.url);
      setPreviaAudio(null);
    } catch (err) {
      console.error("Erro ao enviar áudio:", err);
      setErroGravacao("Não foi possível enviar o áudio. Tente novamente.");
    } finally {
      setEnviandoAudio(false);
    }
  }

  return (
    <div className={styles.conversa}>
      <div className={styles.listaMensagens}>
        {mensagens.length === 0 && (
          <p className={styles.aviso}>{mensagemBoasVindas || "Envie uma mensagem para começar a conversa."}</p>
        )}
        {mensagens.map((m) => {
          const minha = m.userFrom === true;
          const isImagem = m.attachment?.content_type?.startsWith("image/");
          const isAudio = m.attachment?.content_type?.startsWith("audio/");
          const isLocalizacao = m.attachment?.type === "location";
          return (
            <div key={m.id} className={`${styles.bolhaWrap} ${minha ? styles.bolhaWrapDireita : ""}`}>
              {/* Ícone por tipo de remetente — mesmo padrão do chat de
                  Atendimento no hcCore (MessageItem.tsx): fone de ouvido
                  pra quem atende, pessoa pra quem é atendido. Aqui o
                  visitante do site é sempre quem é "atendido". */}
              {!minha && (
                <div className={styles.bolhaAvatar} title="Central de Atendimento">
                  <Headphones size={14} />
                </div>
              )}
              <div className={`${styles.bolha} ${minha ? styles.bolhaMinha : styles.bolhaOutro}`}>
                {!minha && <div className={styles.bolhaAutor}>{m.from_user?.nome || "Atendimento"}</div>}
                {m.attachment ? (
                  isImagem ? (
                    <a href={m.attachment.src} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.attachment.src} alt={m.attachment.name} className={styles.bolhaImagem} />
                    </a>
                  ) : isAudio ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <audio controls src={m.attachment.src} className={styles.bolhaAudio} />
                  ) : isLocalizacao && parseCoordenadas(m.attachment.src) ? (
                    (() => {
                      const coords = parseCoordenadas(m.attachment!.src)!;
                      return (
                        <div className={styles.bolhaLocalizacao}>
                          <iframe
                            src={urlMapaEmbed(coords.lat, coords.lng)}
                            className={styles.bolhaMapa}
                            loading="lazy"
                            title="Localização compartilhada"
                          />
                          <a
                            href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.bolhaAnexo}
                          >
                            <MapPin size={14} /> Abrir no Google Maps
                          </a>
                        </div>
                      );
                    })()
                  ) : (
                    <a href={m.attachment.src} target="_blank" rel="noopener noreferrer" className={styles.bolhaAnexo}>
                      <FileText size={16} /> {m.attachment.name}
                    </a>
                  )
                ) : (
                  <p className={styles.bolhaTexto}>{m.body}</p>
                )}
                <span className={styles.bolhaHora}>
                  {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {minha && (
                <div className={styles.bolhaAvatar} title="Você">
                  <User size={14} />
                </div>
              )}
            </div>
          );
        })}
        <div ref={fimRef} />
      </div>

      {erroGravacao && <p className={styles.gravacaoErro}>{erroGravacao}</p>}

      {gravando ? (
        <div className={styles.gravacaoRow}>
          <span className={styles.gravacaoPonto} />
          <span className={styles.gravacaoTempo}>{formatarTempo(duracaoGravacao)}</span>
          <span className={styles.gravacaoAviso}>Gravando áudio...</span>
          <button
            type="button"
            className={styles.gravacaoCancelar}
            onClick={cancelarGravacao}
            aria-label="Cancelar gravação"
          >
            <Trash2 size={18} />
          </button>
          <button type="button" className={styles.enviarBtn} onClick={pararGravacao} aria-label="Parar gravação">
            <Square size={14} />
          </button>
        </div>
      ) : previaAudio ? (
        <div className={styles.gravacaoRow}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={previaAudio.url} className={styles.previaAudioPlayer} />
          <button
            type="button"
            className={styles.gravacaoCancelar}
            onClick={apagarPreviaAudio}
            disabled={enviandoAudio}
            aria-label="Apagar gravação"
          >
            <Trash2 size={18} />
          </button>
          <button
            type="button"
            className={styles.enviarBtn}
            onClick={enviarAudioGravado}
            disabled={enviandoAudio}
            aria-label="Enviar áudio"
          >
            {enviandoAudio ? <span className={styles.spinner} /> : <Send size={16} />}
          </button>
        </div>
      ) : (
        <div className={styles.inputRow}>
          <label className={styles.anexoBtn} aria-label="Enviar anexo">
            {enviandoAnexo ? <span className={styles.spinner} /> : <Paperclip size={18} />}
            <input type="file" hidden onChange={handleSelecionarArquivo} disabled={enviandoAnexo} />
          </label>
          <button
            type="button"
            className={styles.anexoBtn}
            onClick={handleEnviarLocalizacao}
            disabled={enviandoLocalizacao}
            aria-label="Enviar localização"
          >
            {enviandoLocalizacao ? <span className={styles.spinner} /> : <MapPin size={18} />}
          </button>
          <input
            className={styles.input}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleEnviarTexto();
              }
            }}
            placeholder="Digite sua mensagem aqui"
            disabled={enviando}
          />
          {texto.trim() ? (
            <button
              type="button"
              className={styles.enviarBtn}
              onClick={handleEnviarTexto}
              disabled={enviando || !texto.trim()}
              aria-label="Enviar mensagem"
            >
              <Send size={16} />
            </button>
          ) : (
            <button
              type="button"
              className={styles.enviarBtn}
              onClick={iniciarGravacao}
              disabled={enviandoAnexo || enviandoAudio}
              aria-label="Gravar áudio"
            >
              <Mic size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
