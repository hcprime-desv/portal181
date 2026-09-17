"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Paperclip } from "lucide-react";
import StepIndicator from "./StepIndicator";
import { NATUREZAS, PASSOS, WIZARD_INICIAL, type WizardState } from "@/types/wizard";
import ConfirmacaoDenuncia from "./ConfirmacaoDenuncia";
import Captcha, { type CaptchaHandle } from "@/components/common/Captcha";
import { registrarDenuncia } from "@/lib/denunciaClient";
import { registrarEvento } from "@/lib/audiencia";
import { subscribeNaturezas } from "@/lib/data";
import { uploadFile, formatBytes } from "@/lib/firebase/gen";

export default function DenunciaWizard() {
  // Listener em tempo real (dados/{tenant}/natureza, mesma tabela da
  // apuração operacional do hcCore) — cai no fallback fixo de
  // types/wizard.ts enquanto carrega ou se a coleção ainda não tiver sido
  // populada.
  const [opcoesNatureza, setOpcoesNatureza] = useState<readonly string[]>(NATUREZAS);
  useEffect(() => {
    const unsub = subscribeNaturezas(setOpcoesNatureza);
    return () => unsub();
  }, []);

  const [passo, setPasso] = useState(1);
  const [dados, setDados] = useState<WizardState>(WIZARD_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ protocolo: string } | null>(null);
  const [captchaValido, setCaptchaValido] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);
  // Conta "denúncia iniciada" só na 1ª vez que o passo 1 é concluído nesta
  // sessão do wizard — evita contar de novo se o usuário voltar e avançar
  // várias vezes (não é um contador de cliques, é "quantas pessoas
  // chegaram a começar preencher").
  const jaContouInicioRef = useRef(false);

  function set<K extends keyof WizardState>(campo: K, valor: WizardState[K]) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  function proximo() {
    setErro(null);
    if (passo === 1 && !dados.natureza) {
      setErro("Selecione o que você quer denunciar.");
      return;
    }
    if (passo === 2 && dados.relato.trim().length < 10) {
      setErro("Conte com um pouco mais de detalhes o que aconteceu.");
      return;
    }
    if (passo === 1 && !jaContouInicioRef.current) {
      jaContouInicioRef.current = true;
      registrarEvento("denunciaIniciada");
    }
    setPasso((p) => Math.min(p + 1, PASSOS.length));
  }

  function voltar() {
    setErro(null);
    setPasso((p) => Math.max(p - 1, 1));
  }

  // Sobe pro Storage no momento da seleção (mesmo padrão do hcCore —
  // uploadFile de lib/firebase/gen.ts), não só na hora de enviar a
  // denúncia inteira — assim o usuário já vê o anexo confirmado antes de
  // revisar e enviar.
  async function onSelecionarArquivos(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return;
    setErro(null);
    setDados((d) => ({ ...d, enviandoAnexo: true }));
    try {
      const novos = await Promise.all(
        Array.from(arquivos).map(async (file) => ({
          nome: file.name,
          tipo: file.type || "arquivo",
          tamanho: formatBytes(file.size),
          url: await uploadFile(file),
          dataUpload: Date.now(),
        })),
      );
      setDados((d) => ({ ...d, anexos: [...d.anexos, ...novos], enviandoAnexo: false }));
    } catch (e) {
      console.error(e);
      setErro("Não foi possível enviar o(s) arquivo(s). Tente novamente.");
      setDados((d) => ({ ...d, enviandoAnexo: false }));
    }
  }

  function removerAnexo(i: number) {
    setDados((d) => ({ ...d, anexos: d.anexos.filter((_, x) => x !== i) }));
  }

  async function enviar() {
    if (!captchaValido) return;
    setEnviando(true);
    setErro(null);
    try {
      const registro = await registrarDenuncia({
        natureza: dados.natureza,
        relato: dados.relato,
        municipio: dados.municipio || undefined,
        bairro: dados.bairro || undefined,
        endereco: dados.endereco || undefined,
        envolvidos: dados.envolvidos.length ? dados.envolvidos : undefined,
        veiculos: dados.veiculos.length ? dados.veiculos : undefined,
        anexos: dados.anexos.length ? dados.anexos : undefined,
      });
      setResultado(registro);
    } catch (e: any) {
      console.error(e);
      setErro("Não foi possível registrar a denúncia agora. Tente novamente.");
      captchaRef.current?.regenerar();
      setCaptchaValido(false);
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    return (
      <ConfirmacaoDenuncia
        protocolo={resultado.protocolo}
        onNovaDenuncia={() => {
          setResultado(null);
          setDados(WIZARD_INICIAL);
          setPasso(1);
        }}
      />
    );
  }

  return (
    <div className="panel">
      <div className="panel-body">
        <StepIndicator atual={passo} />

        {passo === 1 && (
          <>
            <h2>1. O que você quer denunciar?</h2>
            <p style={{ color: "var(--muted)" }}>
              Selecione a natureza que melhor se enquadra na sua denúncia.
            </p>
            <div className="categories">
              {opcoesNatureza.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`category${dados.natureza === n ? " selected" : ""}`}
                  onClick={() => set("natureza", n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        )}

        {passo === 2 && (
          <>
            <h2>2. Conte o que aconteceu</h2>
            <p style={{ color: "var(--muted)" }}>
              Descreva com o máximo de detalhes possível. Você não precisa se identificar.
            </p>
            <div className="field full">
              <label>Relato</label>
              <textarea
                value={dados.relato}
                onChange={(e) => set("relato", e.target.value)}
                placeholder="Descreva detalhadamente os fatos..."
              />
            </div>
          </>
        )}

        {passo === 3 && (
          <>
            <h2>3. Onde aconteceu?</h2>
            <div className="form-grid">
              <div className="field">
                <label>Município</label>
                <input
                  value={dados.municipio}
                  onChange={(e) => set("municipio", e.target.value)}
                  placeholder="Ex.: Salvador"
                />
              </div>
              <div className="field">
                <label>Bairro</label>
                <input
                  value={dados.bairro}
                  onChange={(e) => set("bairro", e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              <div className="field full">
                <label>Endereço / ponto de referência</label>
                <input
                  value={dados.endereco}
                  onChange={(e) => set("endereco", e.target.value)}
                  placeholder="Rua, número, referência ou localização aproximada"
                />
              </div>
            </div>
          </>
        )}

        {passo === 4 && (
          <>
            <h2>4. Quem está envolvido?</h2>
            <p style={{ color: "var(--muted)" }}>Opcional — preencha o que souber.</p>
            {dados.envolvidos.map((env, i) => (
              <div className="form-grid" key={i} style={{ marginBottom: 14 }}>
                <div className="field">
                  <label>Nome ou apelido</label>
                  <input
                    value={env.nome ?? ""}
                    onChange={(e) => {
                      const lista = [...dados.envolvidos];
                      lista[i] = { ...lista[i], nome: e.target.value };
                      set("envolvidos", lista);
                    }}
                  />
                </div>
                <div className="field">
                  <label>Características / telefone / rede social</label>
                  <input
                    value={env.caracteristicas ?? ""}
                    onChange={(e) => {
                      const lista = [...dados.envolvidos];
                      lista[i] = { ...lista[i], caracteristicas: e.target.value };
                      set("envolvidos", lista);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-outline full"
                  onClick={() => set("envolvidos", dados.envolvidos.filter((_, x) => x !== i))}
                >
                  <Trash2 size={16} /> Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => set("envolvidos", [...dados.envolvidos, {}])}
            >
              <Plus size={16} /> Adicionar envolvido
            </button>
          </>
        )}

        {passo === 5 && (
          <>
            <h2>5. Existe algum veículo envolvido?</h2>
            <p style={{ color: "var(--muted)" }}>Opcional — preencha o que souber.</p>
            {dados.veiculos.map((v, i) => (
              <div className="form-grid" key={i} style={{ marginBottom: 14 }}>
                <div className="field">
                  <label>Placa</label>
                  <input
                    value={v.placa ?? ""}
                    onChange={(e) => {
                      const lista = [...dados.veiculos];
                      lista[i] = { ...lista[i], placa: e.target.value };
                      set("veiculos", lista);
                    }}
                  />
                </div>
                <div className="field">
                  <label>Modelo / cor</label>
                  <input
                    value={v.modelo ?? ""}
                    onChange={(e) => {
                      const lista = [...dados.veiculos];
                      lista[i] = { ...lista[i], modelo: e.target.value };
                      set("veiculos", lista);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-outline full"
                  onClick={() => set("veiculos", dados.veiculos.filter((_, x) => x !== i))}
                >
                  <Trash2 size={16} /> Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => set("veiculos", [...dados.veiculos, {}])}
            >
              <Plus size={16} /> Adicionar veículo
            </button>
          </>
        )}

        {passo === 6 && (
          <>
            <h2>6. Tem alguma prova ou informação complementar?</h2>
            <p style={{ color: "var(--muted)" }}>
              Fotos, vídeos, documentos ou áudio. Opcional.
            </p>
            <div className="field full">
              <label>Anexos</label>
              <input
                type="file"
                multiple
                disabled={dados.enviandoAnexo}
                onChange={(e) => {
                  onSelecionarArquivos(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
            {dados.enviandoAnexo && (
              <p style={{ color: "var(--muted)", fontSize: 14 }}>Enviando...</p>
            )}
            {dados.anexos.length > 0 && (
              <ul style={{ color: "var(--muted)", fontSize: 14 }}>
                {dados.anexos.map((a, i) => (
                  <li key={a.url}>
                    <Paperclip size={14} className="inline mr-1" /> {a.nome} ({a.tamanho})
                    <button
                      type="button"
                      onClick={() => removerAnexo(i)}
                      style={{ marginLeft: 8, color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {passo === 7 && (
          <>
            <h2>7. Revisar e enviar</h2>
            <div className="form-grid">
              <div className="field full">
                <label>Natureza</label>
                <p>{dados.natureza}</p>
              </div>
              <div className="field full">
                <label>Relato</label>
                <p>{dados.relato}</p>
              </div>
              <div className="field">
                <label>Local</label>
                <p>
                  {[dados.endereco, dados.bairro, dados.municipio].filter(Boolean).join(", ") ||
                    "Não informado"}
                </p>
              </div>
              <div className="field">
                <label>Envolvidos / veículos / anexos</label>
                <p>
                  {dados.envolvidos.length} envolvido(s), {dados.veiculos.length} veículo(s), {dados.anexos.length} anexo(s)
                </p>
              </div>
            </div>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              Nenhum dado de identificação pessoal é obrigatório. Ao enviar, você receberá um
              número de protocolo — guarde-o para acompanhar sua denúncia.
            </p>
            <Captcha ref={captchaRef} onChange={setCaptchaValido} className="field" />
          </>
        )}

        {erro && (
          <p style={{ color: "var(--red)", fontWeight: 700, marginTop: 16 }}>{erro}</p>
        )}

        <div className="actions" style={{ justifyContent: "flex-end" }}>
          {passo > 1 && (
            <button type="button" className="btn btn-outline" onClick={voltar} disabled={enviando}>
              Voltar
            </button>
          )}
          {passo < PASSOS.length ? (
            <button type="button" className="btn btn-blue" onClick={proximo} disabled={dados.enviandoAnexo}>
              Próximo →
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-blue"
              onClick={enviar}
              disabled={enviando || dados.enviandoAnexo || !captchaValido}
            >
              {enviando ? "Enviando..." : "Enviar denúncia →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
