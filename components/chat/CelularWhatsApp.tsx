// CÓPIA gerada por scripts/copiar-chat-site.py — NÃO edite aqui: altere em packages/components/src/omnichannel e copie de novo.
// Padrão core360 (@hc/components/omnichannel/chat/CelularWhatsApp) — 10/11/2026. Altere AQUI.
//
// CELULAR COM O LAYOUT DO WHATSAPP — só a parte VISUAL, sem banco nem lojas: depende apenas de React e lucide-react, para
// ser usado nos painéis (ConversaRapida, prévia dos Formulários do WhatsApp) e COPIADO para os sites (chat do site
// público: os sites não podem depender de @hc/*). Segue o tema claro/escuro da página (html[data-theme-mode="dark"]) ou
// o `tema` passado.
//
//   <MolduraCelular W={W}>
//     <TopoWhatsapp W={W} nome="Maria" subtitulo="online" aoVoltar={fechar} />
//     <FundoConversa W={W}>
//       <AvisoSistema W={W}>🔒 …</AvisoSistema>
//       <SeparadorDia W={W} texto="HOJE" />
//       <BalaoWhatsapp W={W} meu hora="14:20" visto>Olá</BalaoWhatsapp>
//     </FundoConversa>
//     <RodapeWhatsapp W={W} aoEnviarTexto={…} aoAnexar={…} aoAudio={…} />
//   </MolduraCelular>
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CheckCheck, FileText, MapPin, Mic, Paperclip, SendHorizontal, Trash2 } from "lucide-react";

export const PALETAS_WHATSAPP = {
  escuro: {
    fundo: "#0b141a", topo: "#202c33", meu: "#005c4b", dela: "#202c33", texto: "#e9edef", suave: "#8696a0", horaMeu: "#99beb7",
    campo: "#2a3942", verde: "#00a884", azul: "#53bdeb", aviso: "#182229", avisoTexto: "#ffd279", menu: "#233138", ponto: "#202c33",
    sombra: "rgba(0,0,0,.6)", moldura: "#111b21", anexo: "rgba(0,0,0,.18)", folha: "#1f2c34", borda: "#2f3b43",
  },
  claro: {
    fundo: "#efeae2", topo: "#f0f2f5", meu: "#d9fdd3", dela: "#ffffff", texto: "#111b21", suave: "#667781", horaMeu: "#667781",
    campo: "#ffffff", verde: "#00a884", azul: "#53bdeb", aviso: "#ffeecd", avisoTexto: "#54656f", menu: "#ffffff", ponto: "#e3ddd3",
    sombra: "rgba(0,0,0,.25)", moldura: "#1f2c33", anexo: "rgba(0,0,0,.06)", folha: "#ffffff", borda: "#d1d7db",
  },
};
export type PaletaWhatsapp = typeof PALETAS_WHATSAPP.escuro;

/** Paleta pelo tema da página (troca ao vivo) — ou fixa com `tema`. Painéis: html[data-theme-mode="dark"]; sites:
 *  html[data-tema="escuro"]. */
export function usePaletaWhatsapp(tema?: "claro" | "escuro"): PaletaWhatsapp {
  const ler = () => {
    if (typeof document === "undefined") return false;
    const h = document.documentElement;
    return h.getAttribute("data-theme-mode") === "dark" || h.getAttribute("data-tema") === "escuro";
  };
  const [escuro, setEscuro] = useState(false);
  useEffect(() => {
    if (tema || typeof MutationObserver === "undefined") return;
    setEscuro(ler());
    const obs = new MutationObserver(() => setEscuro(ler()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme-mode", "data-tema"] });
    return () => obs.disconnect();
  }, [tema]);
  return PALETAS_WHATSAPP[tema ?? (escuro ? "escuro" : "claro")];
}

export const horaCurta = (v: any) => { const n = Number(v) || Date.parse(String(v ?? "")); return Number.isFinite(n) && n ? new Date(n).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""; };
export const rotuloDia = (v: any) => {
  const n = Number(v) || Date.parse(String(v ?? "")); if (!Number.isFinite(n) || !n) return "";
  const d = new Date(n).setHours(0, 0, 0, 0), hoje = new Date().setHours(0, 0, 0, 0);
  if (d === hoje) return "HOJE";
  if (d === hoje - 86400000) return "ONTEM";
  return new Date(n).toLocaleDateString("pt-BR");
};
const coordenadas = (s: any) => {
  const m = decodeURIComponent(String(s ?? "")).match(/(-?\d{1,3}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)/);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : null;
};

/** Corpo do aparelho (moldura escura com cantos arredondados). */
export function MolduraCelular({ W, children, largura = 390, altura = 780 }: { W: PaletaWhatsapp; children: React.ReactNode; largura?: number; altura?: number }) {
  return (
    <div style={{ width: `min(${largura}px, 96vw)`, height: `min(${altura}px, 90vh)`, border: `10px solid ${W.moldura}`, borderRadius: 34, overflow: "hidden", display: "flex", flexDirection: "column", background: W.fundo, boxShadow: `0 20px 60px ${W.sombra}`, margin: "0 auto", position: "relative" }}>
      {children}
    </div>
  );
}

/** Barra do contato: voltar, avatar com a inicial, nome, subtítulo e ações à direita (ex.: menu ⋮). */
export function TopoWhatsapp({ W, nome, subtitulo, aoVoltar, acoes, avatar }: { W: PaletaWhatsapp; nome: React.ReactNode; subtitulo?: React.ReactNode; aoVoltar?: () => void; acoes?: React.ReactNode; avatar?: string }) {
  const inicial = String(typeof nome === "string" ? nome : "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <div style={{ background: W.topo, color: W.texto, display: "flex", alignItems: "center", gap: 8, padding: "18px 8px 10px", position: "relative" }}>
      {aoVoltar ? <button type="button" aria-label="Voltar" onClick={aoVoltar} style={{ background: "none", border: 0, color: W.texto, padding: 4 }}><ArrowLeft size={22} /></button> : null}
      {avatar
        ? <img src={avatar} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
        : <div aria-hidden style={{ width: 38, height: 38, borderRadius: "50%", background: "#6a7175", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700 }}>{inicial}</div>}
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
        <div style={{ fontWeight: 600, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nome}</div>
        {subtitulo ? <div style={{ fontSize: 12, color: W.suave, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitulo}</div> : null}
      </div>
      {acoes}
    </div>
  );
}

/** Área das mensagens com o fundo do WhatsApp (rola sozinha até o fim quando `rolarPara` muda). */
export function FundoConversa({ W, children, rolarPara, onClick }: { W: PaletaWhatsapp; children: React.ReactNode; rolarPara?: any; onClick?: () => void }) {
  const fim = useRef<HTMLDivElement>(null);
  useEffect(() => { fim.current?.scrollIntoView({ block: "end" }); }, [rolarPara]);
  return (
    <div onClick={onClick} style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "10px 12px", background: `radial-gradient(${W.ponto} 1px, transparent 1px) 0 0 / 22px 22px, ${W.fundo}` }}>
      {children}
      <div ref={fim} />
    </div>
  );
}

export const AvisoSistema = ({ W, children }: { W: PaletaWhatsapp; children: React.ReactNode }) => (
  <div style={{ background: W.aviso, color: W.avisoTexto, fontSize: 12, textAlign: "center", borderRadius: 7, padding: "6px 10px", margin: "0 auto 10px", maxWidth: "92%" }}>{children}</div>
);

export const SeparadorDia = ({ W, texto }: { W: PaletaWhatsapp; texto: string }) => (
  <div style={{ textAlign: "center", margin: "10px 0" }}>
    <span style={{ background: W.dela, color: W.suave, fontSize: 12, padding: "4px 10px", borderRadius: 7, boxShadow: "0 1px .5px rgba(0,0,0,.13)" }}>{texto}</span>
  </div>
);

/** Anexo dentro do balão: foto, vídeo, áudio, documento ou localização (mapa). `a` = { src, content_type, type, name, extension }. */
export function AnexoWhatsapp({ W, a }: { W: PaletaWhatsapp; a: any }) {
  const src = a?.src || a?.url;
  if (!src) return null;
  const tipo = String(a?.content_type || "");
  if (a?.type === "location" || tipo.startsWith("location")) {
    const c = coordenadas(src);
    if (!c) return <span style={{ color: W.suave }}>Localização</span>;
    return (
      <a href={`https://www.google.com/maps?q=${c.lat},${c.lng}`} target="_blank" rel="noopener noreferrer" style={{ display: "block", color: W.texto, textDecoration: "none" }}>
        <iframe title="Localização" src={`https://maps.google.com/maps?q=${c.lat},${c.lng}&z=15&output=embed`} style={{ width: 240, height: 140, border: 0, borderRadius: 6, pointerEvents: "none", display: "block" }} loading="lazy" />
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, marginTop: 4 }}><MapPin size={14} /> Abrir no mapa</span>
      </a>
    );
  }
  const ext = String(a?.extension || "").toLowerCase();
  if (a?.type === "audio" || tipo.includes("audio") || ["webm", "ogg", "ptt", "mp3", "audio"].includes(ext)) return <audio controls src={src} style={{ width: 240, height: 40 }} />;
  if (tipo.startsWith("image") || /\.(jpe?g|png|webp|gif)/i.test(decodeURIComponent(String(src).split("?")[0])))
    return <a href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt={a?.name || "Imagem"} style={{ maxWidth: 240, maxHeight: 260, borderRadius: 6, display: "block" }} /></a>;
  if (tipo.includes("video") || ["mp4", "video"].includes(ext)) return <video controls src={src} style={{ maxWidth: 240, borderRadius: 6 }} />;
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, background: W.anexo, padding: 8, borderRadius: 6, color: W.texto, textDecoration: "none" }}>
      <FileText size={22} /> <span style={{ fontSize: 13, wordBreak: "break-all" }}>{a?.name || "Documento"}</span>
    </a>
  );
}

/** Balão de mensagem: verde (meu) à direita, branco/cinza (da pessoa) à esquerda, hora e vistos dentro. */
export function BalaoWhatsapp({ W, meu, hora, visto, rotulo, anexo, children }: { W: PaletaWhatsapp; meu?: boolean; hora?: string; visto?: boolean; rotulo?: React.ReactNode; anexo?: any; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: meu ? "flex-end" : "flex-start", margin: "2px 0" }}>
      <div style={{ background: meu ? W.meu : W.dela, color: W.texto, maxWidth: "82%", padding: "6px 8px 4px", borderRadius: 8, [meu ? "borderTopRightRadius" : "borderTopLeftRadius"]: 2, boxShadow: "0 1px .5px rgba(0,0,0,.13)" } as React.CSSProperties}>
        {rotulo ? <div style={{ fontSize: 11, color: W.suave, marginBottom: 2 }}>{rotulo}</div> : null}
        {anexo ? <div style={{ marginBottom: children ? 4 : 0 }}><AnexoWhatsapp W={W} a={anexo} /></div> : null}
        {children ? <span style={{ fontSize: 14.2, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{children}</span> : null}
        {hora ? (
          <span style={{ float: "right", fontSize: 11, color: meu ? W.horaMeu : W.suave, marginLeft: 8, marginTop: 6, display: "inline-flex", alignItems: "center", gap: 2 }}>
            {hora}{meu ? (visto ? <CheckCheck size={15} color={W.azul} /> : <Check size={15} />) : null}
          </span>
        ) : null}
        <div style={{ clear: "both" }} />
      </div>
    </div>
  );
}

/**
 * Rodapé de digitação: campo arredondado com 📎, botão verde que vira microfone com o campo vazio e gravação de áudio
 * (MediaRecorder, webm). Enter envia; Shift+Enter quebra linha. Sem `aoAudio`/`aoAnexar` os botões somem.
 */
export function RodapeWhatsapp({ W, aoEnviarTexto, aoAnexar, aoAudio, desabilitado, placeholder = "Mensagem", aceitar = "image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx" }: {
  W: PaletaWhatsapp; aoEnviarTexto: (texto: string) => Promise<boolean | void> | boolean | void; aoAnexar?: (arquivo: File) => void; aoAudio?: (audio: Blob) => void;
  desabilitado?: boolean; placeholder?: string; aceitar?: string;
}) {
  const [texto, setTexto] = useState("");
  const [gravando, setGravando] = useState<number | null>(null);
  const [segundos, setSegundos] = useState(0);
  const gravador = useRef<MediaRecorder | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const descartar = useRef(false);
  const arquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!gravando) return;
    const t = setInterval(() => setSegundos(Math.round((Date.now() - gravando) / 1000)), 500);
    return () => clearInterval(t);
  }, [gravando]);

  const enviar = async () => {
    const corpo = texto.trim();
    if (!corpo || desabilitado) return;
    const r = await aoEnviarTexto(corpo);
    if (r !== false) setTexto("");
  };
  const gravar = async () => {
    try {
      const fluxo = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(fluxo);
      pedacos.current = []; descartar.current = false;
      rec.ondataavailable = (e) => { if (e.data.size) pedacos.current.push(e.data); };
      rec.onstop = () => {
        fluxo.getTracks().forEach((t) => t.stop());
        if (!descartar.current && pedacos.current.length) aoAudio?.(new Blob(pedacos.current, { type: "audio/webm" }));
      };
      rec.start(); gravador.current = rec; setSegundos(0); setGravando(Date.now());
    } catch { window.alert("Não foi possível usar o microfone (permita o acesso no navegador)."); }
  };
  const parar = (mandar: boolean) => { descartar.current = !mandar; gravador.current?.stop(); gravador.current = null; setGravando(null); };
  const botaoRedondo: React.CSSProperties = { width: 46, height: 46, borderRadius: "50%", background: W.verde, border: 0, color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 };

  if (gravando) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px 14px", background: W.fundo }}>
        <button type="button" aria-label="Descartar áudio" onClick={() => parar(false)} style={{ background: "none", border: 0, color: W.suave }}><Trash2 size={22} /></button>
        <div style={{ flex: 1, color: "#f15c6d", fontSize: 15 }}>● Gravando {Math.floor(segundos / 60)}:{String(segundos % 60).padStart(2, "0")}</div>
        <button type="button" aria-label="Enviar áudio" onClick={() => parar(true)} style={botaoRedondo}><SendHorizontal size={20} /></button>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); void enviar(); }} style={{ display: "flex", alignItems: "flex-end", gap: 6, padding: "8px 8px 14px", background: W.fundo }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", background: W.campo, borderRadius: 24, padding: "4px 6px 4px 14px", minHeight: 46 }}>
        <textarea aria-label="Mensagem" rows={1} value={texto} placeholder={placeholder} disabled={desabilitado}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(); } }}
          style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: W.texto, resize: "none", fontSize: 15, maxHeight: 110, padding: "8px 0" }} />
        {aoAnexar ? (
          <>
            <button type="button" aria-label="Anexar arquivo" onClick={() => arquivo.current?.click()} style={{ background: "none", border: 0, color: W.suave, padding: 6 }}><Paperclip size={21} /></button>
            <input ref={arquivo} type="file" hidden accept={aceitar} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) aoAnexar(f); }} />
          </>
        ) : null}
      </div>
      {texto.trim() || !aoAudio
        ? <button type="submit" aria-label="Enviar" disabled={desabilitado || !texto.trim()} style={botaoRedondo}><SendHorizontal size={20} /></button>
        : <button type="button" aria-label="Gravar áudio" disabled={desabilitado} onClick={() => void gravar()} style={botaoRedondo}><Mic size={20} /></button>}
    </form>
  );
}
