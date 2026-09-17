"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { obterVisitanteId } from "@/lib/visitante";
import { buscarAtendimentoAtivo } from "@/lib/chatClient";
import type { Atendimento } from "@/types/chat";
import ChatConversa from "./ChatConversa";
import styles from "./ChatWidget.module.css";

export interface ChatWidgetProps {
  /** Nome exibido no cabeçalho do chat. Default: "Central de Atendimento". */
  nomeAtendente?: string;
  /** URL de um avatar (imagem) pro cabeçalho — sem isso usa um ícone genérico. */
  avatarUrl?: string;
  /** Texto do balão que aparece ao lado do botão flutuante. */
  rotuloBotao?: string;
  /** Assunto gravado no chamado quando a 1ª mensagem é enviada. */
  assuntoPadrao?: string;
  /** Mensagem mostrada antes de qualquer troca de mensagem. */
  mensagemBoasVindas?: string;
}

// Botão flutuante (canto inferior direito) que abre um chat com a Central
// de Atendimento — mesmo modelo de dados do Atendimento real do hcCore
// (coleção `chats`/`messages`, ver lib/chatClient.ts), então uma conversa
// aberta aqui cai na fila de um agente humano de verdade, exatamente como
// o app mobile hcpesquisa (fonte da lógica portada aqui).
//
// Reutilizável em qualquer app Next.js que já siga o mesmo padrão deste
// projeto: precisa existir `@/lib/firebase/client` (db/storage do
// Firebase) e uma env `NEXT_PUBLIC_<APP>_PATH` resolvendo o tenant dentro
// de `lib/firebase/gen.ts` (copie a pasta components/chat/ + lib/chatClient.ts
// + lib/visitante.ts + types/chat.ts pro novo projeto e ajuste só esses
// dois pontos de acesso ao Firebase).
export default function ChatWidget({
  nomeAtendente = "Central de Atendimento",
  avatarUrl,
  rotuloBotao = "Fale conosco",
  assuntoPadrao = "Atendimento pelo site",
  mensagemBoasVindas,
}: ChatWidgetProps) {
  const [aberto, setAberto] = useState(false);
  const [visitante, setVisitante] = useState<{ id: string; nome: string } | null>(null);
  const [atendimento, setAtendimento] = useState<Atendimento | null>(null);
  const [carregando, setCarregando] = useState(false);
  // Controla se a busca já rodou — não dá pra usar `!atendimento` pra isso
  // (o resultado normal, sem atendimento aberto pra retomar, também é
  // `null`, o que reexecutava o efeito pra sempre e piscava o painel).
  const [buscou, setBuscou] = useState(false);

  useEffect(() => {
    setVisitante({ id: obterVisitanteId(), nome: "Visitante" });
  }, []);

  // Só busca um atendimento em aberto pra retomar quando o painel abre de
  // verdade pela 1ª vez — não precisa consultar o Firestore enquanto o
  // botão flutuante está só fechado na tela.
  useEffect(() => {
    if (!aberto || !visitante || buscou) return;
    setCarregando(true);
    buscarAtendimentoAtivo(visitante.id)
      .then((existente) => setAtendimento(existente))
      .catch((err) => console.warn("Não foi possível buscar atendimento em aberto:", err))
      .finally(() => {
        setCarregando(false);
        setBuscou(true);
      });
  }, [aberto, visitante, buscou]);

  if (!visitante) return null;

  return (
    <div className={styles.wrapper}>
      {aberto && (
        <div className={styles.painel}>
          <div className={styles.cabecalho}>
            <div className={styles.cabecalhoAvatar}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={nomeAtendente} />
              ) : (
                <MessageCircle size={20} />
              )}
            </div>
            <div className={styles.cabecalhoTexto}>
              <strong>{nomeAtendente}</strong>
              <span>online</span>
            </div>
            <button type="button" className={styles.fecharBtn} onClick={() => setAberto(false)} aria-label="Fechar chat">
              <X size={18} />
            </button>
          </div>

          {carregando ? (
            <div className={styles.carregando}>Carregando...</div>
          ) : (
            <ChatConversa
              atendimento={atendimento}
              visitante={visitante}
              assuntoPadrao={assuntoPadrao}
              onAtendimentoCriado={setAtendimento}
              mensagemBoasVindas={mensagemBoasVindas}
            />
          )}
        </div>
      )}

      <button
        type="button"
        className={styles.botaoFlutuante}
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar chat" : "Abrir chat"}
      >
        {!aberto && <span className={styles.balao}>{rotuloBotao}</span>}
        {aberto ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
