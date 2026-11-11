"use client";
// CÓPIA gerada por scripts/copiar-chat-site.py — NÃO edite aqui: altere em packages/components/src/omnichannel e copie de novo.
// Padrão core360 (@hc/components/omnichannel/chatSite/ChatMotor) — 10/11/2026. FONTE ÚNICA: os sites recebem uma CÓPIA
// (python scripts/copiar-chat-site.py <site>) — sites não usam @hc/*.
//
// Conversa do chat do site no MESMO MOTOR do WhatsApp (motorSite.ts): desenha o que o motor manda no formato da API do
// WhatsApp — texto, mídia, botões, lista, link, pedir localização e Formulário do WhatsApp (telas na própria página) — e
// devolve as respostas no mesmo formato do webhook. O fluxo (chatbot do DD360, blocos, fila, atendente) é todo do back-end.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { EntradaChat, ItemChat, MotorSite } from "./motorSite";
import { AvisoSistema, BalaoWhatsapp, FundoConversa, MolduraCelular, PALETAS_WHATSAPP, RodapeWhatsapp, SeparadorDia, TopoWhatsapp, horaCurta, rotuloDia, usePaletaWhatsapp, type PaletaWhatsapp } from "./CelularWhatsApp";

type Botao = { id: string; titulo: string };
type Folha = { token: string; tela: string; formulario: any; dados: any; cta: string };

const negrito = (t?: string) => (t ? t.split(/(\*[^*]+\*)/g).map((p, i) => (p.startsWith("*") && p.endsWith("*") && p.length > 2 ? <b key={i}>{p.slice(1, -1)}</b> : <React.Fragment key={i}>{p}</React.Fragment>)) : null);

/** Cores do SITE no lugar do verde do WhatsApp (balão do visitante, botões, enviar) e o azul-marinho do tema escuro. */
function paletaDoSite(base: PaletaWhatsapp, cor: string): PaletaWhatsapp {
  const escuro = base.fundo === PALETAS_WHATSAPP.escuro.fundo;
  return escuro
    ? { ...base, verde: cor, azul: `color-mix(in srgb, ${cor} 55%, #ffffff)`, meu: `color-mix(in srgb, ${cor} 45%, #0a2050)`, horaMeu: "#9dbde8",
        fundo: "#0a2050", topo: "#0d2a63", dela: "#0f2b60", campo: "#0f2b60", texto: "color-mix(in srgb, var(--cor-texto-escuro, #bcd8ff) 65%, #ffffff)", suave: "#7fa6dc", ponto: "#0f2b60",
        folha: "#0c2452", borda: "rgba(110, 165, 255, .24)", aviso: "#0d2a63", avisoTexto: "#bcd8ff", menu: "#0c2452", moldura: "#06142f" }
    : { ...base, verde: cor, azul: cor, meu: `color-mix(in srgb, ${cor} 14%, #ffffff)`, horaMeu: "#5f7390",
        fundo: "#f2f5fb", topo: "#ffffff", ponto: "#e1e8f4", aviso: `color-mix(in srgb, ${cor} 10%, #ffffff)`, avisoTexto: "#3d5170" };
}

/**
 * `tema` vazio = segue o tema do site (html[data-tema="escuro"]) ao vivo. `corSite` = cor padrão do site (no lugar do verde
 * do WhatsApp). `celular` = desenha a moldura do celular com o topo do contato (como no painel).
 */
export default function ChatMotor({ motor, boasVindas, tema, corSite, celular }: {
  motor: MotorSite; boasVindas?: string; tema?: "claro" | "escuro"; corSite?: string;
  celular?: { nome: string; subtitulo?: string; avatar?: string; aoFechar?: () => void; largura?: number; altura?: number };
}) {
  const base = usePaletaWhatsapp(tema);
  const W = useMemo(() => (corSite ? paletaDoSite(base, corSite) : base), [base, corSite]);
  const [contato] = useState(motor.obterContato);
  const [itens, setItens] = useState<ItemChat[]>([]);
  const [folha, setFolha] = useState<Folha | null>(null);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => motor.escutar(contato, setItens), [contato, motor]);
  const ultimoMotor = useMemo(() => { for (let i = itens.length - 1; i >= 0; i--) if (itens[i].de === "motor") return itens[i].id; return null; }, [itens]);
  const depoisDoUltimo = (id: string) => itens.findIndex((x) => x.id === id) === itens.length - 1;

  const enviar = async (e: EntradaChat) => {
    setEnviando(true);
    try { await motor.enviar(contato, e); } finally { setEnviando(false); }
  };
  const localizar = () => {
    if (!navigator.geolocation) { void enviar({ type: "text", body: "Não consegui enviar a localização (navegador sem GPS)." }); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => void enviar({ type: "location", latitude: p.coords.latitude, longitude: p.coords.longitude, body: `${p.coords.latitude};${p.coords.longitude}` }),
      () => window.alert("Não foi possível obter a localização. Permita o acesso ou digite o endereço."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  let ultimoDia = "";
  const conversa = (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, position: "relative", background: W.fundo }}>
      <FundoConversa W={W} rolarPara={itens.length}>
        <AvisoSistema W={W}>🔒 {boasVindas || "Atendimento sigiloso. Mande uma mensagem para começar."}</AvisoSistema>
        {!itens.length ? (
          <div style={{ textAlign: "center", margin: "14px 0" }}>
            <button type="button" onClick={() => void enviar({ type: "text", body: "Olá" })} style={{ background: W.verde, color: "#fff", border: 0, borderRadius: 20, padding: "9px 18px", fontWeight: 600 }}>Iniciar atendimento</button>
          </div>
        ) : null}
        {itens.map((it) => {
          const d = rotuloDia(it.em); const sep = d && d !== ultimoDia ? d : ""; if (sep) ultimoDia = d;
          return (
            <React.Fragment key={it.id}>
              {sep ? <SeparadorDia W={W} texto={sep} /> : null}
              {it.de === "eu" ? <MinhaMensagem W={W} it={it} /> : (
                <MensagemMotor W={W} m={it.mensagem} hora={horaCurta(it.em)} ativa={it.id === ultimoMotor && depoisDoUltimo(it.id)}
                  aoResponder={(b, tipo) => void enviar({ type: "interactive", type_interactive: tipo, body: b.id, title: b.titulo })}
                  aoLocalizar={localizar}
                  aoAbrirFormulario={(f) => setFolha(f)} />
              )}
            </React.Fragment>
          );
        })}
      </FundoConversa>
      <RodapeWhatsapp W={W} desabilitado={enviando}
        aoEnviarTexto={async (t) => { await enviar({ type: "text", body: t }); }}
        aoAnexar={(f) => { setEnviando(true); void motor.enviarArquivo(contato, f).finally(() => setEnviando(false)); }} />
      {folha ? <FormularioSite W={W} folha={folha} aoFechar={() => setFolha(null)}
        aoEnviar={async (respostas, resumo) => { setFolha(null); await enviar({ type: "interactive", type_interactive: "nfm_reply", body: JSON.stringify({ flow_token: folha.token, ...respostas }), title: resumo }); }} /> : null}
    </div>
  );
  if (!celular) return conversa;
  return (
    <MolduraCelular W={W} largura={celular.largura ?? 380} altura={celular.altura ?? 640}>
      <TopoWhatsapp W={W} nome={celular.nome} subtitulo={celular.subtitulo ?? "online"} avatar={celular.avatar}
        acoes={celular.aoFechar ? <button type="button" aria-label="Fechar chat" onClick={celular.aoFechar} style={{ background: "none", border: 0, color: W.texto, padding: 4 }}><X size={22} /></button> : null} />
      {conversa}
    </MolduraCelular>
  );
}

function MinhaMensagem({ W, it }: { W: PaletaWhatsapp; it: ItemChat }) {
  const e = it.entrada!;
  if (e.type === "location") return <BalaoWhatsapp W={W} meu hora={horaCurta(it.em)} visto anexo={{ type: "location", src: `${e.latitude},${e.longitude}` }} />;
  if (e.file) return <BalaoWhatsapp W={W} meu hora={horaCurta(it.em)} visto anexo={{ src: e.file, content_type: e.mime_type, name: e.nome_file }} />;
  const texto = e.type_interactive === "nfm_reply" ? `📋 ${e.title || "Formulário enviado"}` : e.title || e.body;
  return <BalaoWhatsapp W={W} meu hora={horaCurta(it.em)} visto>{texto}</BalaoWhatsapp>;
}

function MensagemMotor({ W, m, hora, ativa, aoResponder, aoLocalizar, aoAbrirFormulario }: {
  W: PaletaWhatsapp; m: any; hora: string; ativa: boolean;
  aoResponder: (b: Botao, tipo: "button_reply" | "list_reply") => void; aoLocalizar: () => void; aoAbrirFormulario: (f: Folha) => void;
}) {
  const [listaAberta, setListaAberta] = useState(false);
  // ao abrir a lista, rola até mostrar as opções (sem a pessoa precisar rolar)
  const fimLista = useRef<HTMLDivElement>(null);
  useEffect(() => { if (listaAberta) setTimeout(() => fimLista.current?.scrollIntoView({ block: "end", behavior: "smooth" }), 30); }, [listaAberta]);
  if (!m) return null;
  // a API do WhatsApp aceita mensagem SEM `type` (vale "text"): deduz pelo conteúdo
  if (!m.type) m = { ...m, type: m.text ? "text" : m.interactive ? "interactive" : m.image ? "image" : m.document ? "document" : m.audio ? "audio" : m.video ? "video" : m.location ? "location" : m.template ? "template" : "" };
  const botao = (rotulo: string, onClick: () => void, desabilitado = false) => (
    <button type="button" disabled={desabilitado} onClick={onClick}
      style={{ background: W.dela, color: W.azul, border: 0, borderRadius: 8, padding: "8px 10px", fontSize: 14, fontWeight: 500, opacity: desabilitado ? 0.55 : 1, boxShadow: "0 1px .5px rgba(0,0,0,.13)" }}>{rotulo}</button>
  );
  const caixa = (filhos: React.ReactNode) => <div style={{ display: "flex", flexDirection: "column", gap: 3, margin: "2px 0 6px", maxWidth: "82%" }}>{filhos}</div>;

  if (m.type === "text") return <BalaoWhatsapp W={W} hora={hora}>{negrito(m.text?.body)}</BalaoWhatsapp>;
  if (["image", "video", "audio", "document"].includes(m.type)) {
    const x = m[m.type] || {};
    return <BalaoWhatsapp W={W} hora={hora} anexo={{ src: x.link, content_type: `${m.type}/x`, name: x.filename }}>{x.caption ? negrito(x.caption) : null}</BalaoWhatsapp>;
  }
  if (m.type === "location") return <BalaoWhatsapp W={W} hora={hora} anexo={{ type: "location", src: `${m.location?.latitude},${m.location?.longitude}` }} />;
  if (m.type === "template") return <BalaoWhatsapp W={W} hora={hora}>📄 {m.template?.name}</BalaoWhatsapp>;
  if (m.type === "contacts") return <BalaoWhatsapp W={W} hora={hora}>👤 {m.contacts?.[0]?.name?.formatted_name || "Contato"}</BalaoWhatsapp>;
  if (m.type !== "interactive") return null;

  const i = m.interactive || {};
  const imgCab = i.header?.type === "image" ? i.header?.image?.link : null; // cabeçalho com imagem (ex.: banner do produto)
  const corpo = <>{imgCab ? <img src={imgCab} alt="" style={{ display: "block", width: "100%", borderRadius: 6, marginBottom: 6 }} /> : null}{i.header?.text ? <><b>{i.header.text}</b>{"\n"}</> : null}{negrito(i.body?.text)}{i.footer?.text ? <span style={{ display: "block", fontSize: 12, color: W.suave, marginTop: 4 }}>{i.footer.text}</span> : null}</>;
  const balao = <BalaoWhatsapp W={W} hora={hora}>{corpo}</BalaoWhatsapp>;

  if (i.type === "button") return <>{balao}{caixa((i.action?.buttons || []).map((b: any) => <React.Fragment key={b.reply?.id}>{botao(b.reply?.title, () => aoResponder({ id: b.reply?.id, titulo: b.reply?.title }, "button_reply"), !ativa)}</React.Fragment>))}</>;
  if (i.type === "list") {
    const rows = (i.action?.sections || []).flatMap((s: any) => s.rows || []);
    return (
      <>{balao}{caixa(<>
        {botao(`☰ ${i.action?.button || "Ver opções"}`, () => setListaAberta((v) => !v), !ativa)}
        {listaAberta && ativa ? (
          <div style={{ background: W.dela, borderRadius: 8, overflow: "hidden" }}>
            {rows.map((r: any) => (
              <button key={r.id} type="button" onClick={() => { setListaAberta(false); aoResponder({ id: r.id, titulo: r.title }, "list_reply"); }}
                style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: 0, borderTop: `1px solid ${W.borda}`, color: W.texto, padding: "9px 12px", fontSize: 14 }}>
                {r.title}{r.description ? <span style={{ display: "block", fontSize: 12, color: W.suave }}>{r.description}</span> : null}
              </button>
            ))}
            <div ref={fimLista} />
          </div>
        ) : null}
      </>)}</>
    );
  }
  if (i.type === "cta_url") return <>{balao}{caixa(botao(`🔗 ${i.action?.parameters?.display_text || "Abrir"}`, () => window.open(i.action?.parameters?.url, "_blank", "noopener")))}</>;
  if (i.type === "location_request_message") return <>{balao}{caixa(botao("📍 Enviar localização", aoLocalizar, !ativa))}</>;
  if (i.type === "flow") {
    const p = i.action?.parameters || {};
    return <>{balao}{caixa(botao(p.flow_cta || "Abrir", () => aoAbrirFormulario({ token: p.flow_token, tela: p.flow_action_payload?.screen, dados: p.flow_action_payload?.data || {}, formulario: m.formulario, cta: p.flow_cta }), !ativa))}</>;
  }
  return balao;
}

// Formulário do WhatsApp na página: telas e campos do formulário publicado (mesmas chaves do Flow); a Lista grande (formulário
// do sistema) usa as opções que vieram na mensagem. A resposta volta como nfm_reply, igual à do WhatsApp.
function FormularioSite({ W, folha, aoFechar, aoEnviar }: { W: PaletaWhatsapp; folha: Folha; aoFechar: () => void; aoEnviar: (respostas: Record<string, any>, resumo: string) => void }) {
  const lista = !!folha.formulario?.sistema || folha.tela === "LISTA";
  const telas: any[] = lista ? [] : folha.formulario?.telas || [];
  const [tela, setTela] = useState(0);
  const [val, setVal] = useState<Record<string, any>>({});
  const [busca, setBusca] = useState("");
  const t = telas[tela];
  const ultima = lista || tela >= telas.length - 1;
  const opcoes: any[] = lista ? (folha.dados?.opcoes || []) : [];
  const vistas = opcoes.filter((o) => !busca || String(o.title).toLowerCase().includes(busca.toLowerCase()));
  const faltando = lista ? !val.escolha : (t?.campos || []).some((c: any) => c.obrigatorio && c.tipo !== "aviso" && !(Array.isArray(val[c.chave]) ? val[c.chave].length : String(val[c.chave] ?? "").trim()));
  const inp: React.CSSProperties = { width: "100%", border: `1px solid ${W.borda}`, borderRadius: 8, padding: 8, background: "transparent", color: W.texto, fontSize: 14 };
  const muda = (k: string, v: any) => setVal((x) => ({ ...x, [k]: v }));

  return (
    <div role="dialog" aria-label="Formulário" style={{ position: "absolute", inset: "18px 0 0 0", background: W.folha, borderTopLeftRadius: 16, borderTopRightRadius: 16, display: "flex", flexDirection: "column", boxShadow: `0 -4px 16px ${W.sombra}`, color: W.texto, zIndex: 5 }}>
      <div style={{ display: "flex", alignItems: "center", padding: "12px", borderBottom: `1px solid ${W.borda}` }}>
        <button type="button" aria-label="Fechar" onClick={aoFechar} style={{ background: "none", border: 0, color: W.texto }}><X size={20} /></button>
        <div style={{ flex: 1, textAlign: "center", fontWeight: 600 }}>{lista ? folha.dados?.titulo || "Escolha" : t?.titulo || folha.formulario?.nome || "Formulário"}</div>
        <span style={{ width: 20 }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "12px 16px" }}>
        {lista ? (
          <>
            {folha.dados?.texto ? <p style={{ fontSize: 13, color: W.suave }}>{folha.dados.texto}</p> : null}
            {opcoes.length > 20 ? <input placeholder="Buscar" value={busca} onChange={(e) => setBusca(e.target.value)} style={{ ...inp, marginBottom: 8 }} /> : null}
            {vistas.map((o) => (
              <label key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 0", borderBottom: `1px solid ${W.borda}`, cursor: "pointer" }}>
                <span style={{ fontSize: 14 }}>{o.title}{o.description ? <span style={{ display: "block", fontSize: 12, color: W.suave }}>{o.description}</span> : null}</span>
                <input type="radio" name="escolha" checked={val.escolha === o.id} onChange={() => muda("escolha", o.id)} />
              </label>
            ))}
          </>
        ) : !t ? <p>Formulário indisponível.</p> : (
          <>
            {t.texto ? <p style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{t.texto}</p> : null}
            {(t.campos || []).map((c: any) => (
              <div key={c.chave || c.rotulo} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: c.tipo === "aviso" ? W.texto : W.suave, marginBottom: 4, whiteSpace: "pre-wrap" }}>{c.rotulo}{c.tipo !== "aviso" && !c.obrigatorio ? " (opcional)" : ""}</div>
                {c.tipo === "aviso" ? null
                  : c.tipo === "escolha" || c.tipo === "sim_nao" ? (
                    <select value={val[c.chave] ?? ""} onChange={(e) => muda(c.chave, e.target.value)} style={inp}>
                      <option value="">Escolha</option>
                      {(c.opcoes || []).map((o: any) => <option key={o.id} value={o.id}>{o.titulo}</option>)}
                    </select>
                  ) : c.tipo === "multipla" ? (c.opcoes || []).map((o: any) => (
                    <label key={o.id} style={{ display: "flex", gap: 8, fontSize: 14, padding: "4px 0" }}>
                      <input type="checkbox" checked={(val[c.chave] || []).includes(o.id)} onChange={(e) => muda(c.chave, e.target.checked ? [...(val[c.chave] || []), o.id] : (val[c.chave] || []).filter((x: string) => x !== o.id))} /> {o.titulo}
                    </label>
                  )) : c.tipo === "texto_longo" ? <textarea rows={3} value={val[c.chave] ?? ""} onChange={(e) => muda(c.chave, e.target.value)} style={inp} />
                  : <input type={c.tipo === "data" ? "date" : c.tipo === "numero" ? "number" : c.tipo === "email" ? "email" : c.tipo === "telefone" ? "tel" : "text"} value={val[c.chave] ?? ""} onChange={(e) => muda(c.chave, e.target.value)} style={inp} />}
              </div>
            ))}
          </>
        )}
      </div>
      <div style={{ padding: "10px 16px 12px", borderTop: `1px solid ${W.borda}` }}>
        <button type="button" disabled={faltando}
          onClick={() => {
            if (!ultima) { setTela(tela + 1); return; }
            const resumo = lista ? String(opcoes.find((o) => o.id === val.escolha)?.title ?? "") : folha.formulario?.nome || "Formulário enviado";
            aoEnviar(val, resumo);
          }}
          style={{ width: "100%", background: W.verde, color: "#fff", border: 0, borderRadius: 22, padding: "10px 0", fontWeight: 600, opacity: faltando ? 0.5 : 1 }}>
          {lista ? "Confirmar" : t?.botao || (ultima ? "Enviar" : "Continuar")}
        </button>
      </div>
    </div>
  );
}
