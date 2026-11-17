"use client";
// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/components/src/dashboard/svg.tsx e copie de novo.
// KIT DE DASHBOARD — peças SEM DEPENDÊNCIA (só React + SVG): pulso (batimento/ECG), mini tendência, rosca, barras em
// degradê e cartão de KPI em degradê. FONTE ÚNICA: usadas pelo kit dos painéis (@hc/components/dashboard/Dash) e
// COPIADAS para o /admin dos sites por `python scripts/copiar-admin-site.py <site>` (os sites não usam @hc/* nem recharts).
// Não editar a cópia no site. Datas/valores chegam prontos (contas em dashboard/dados.ts ou no próprio site).
import React, { useId, useMemo } from "react";

export const GRADIENTES_DASH = {
  azul: "linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)",
  roxo: "linear-gradient(135deg, #6d28d9 0%, #a21caf 100%)",
  limao: "linear-gradient(135deg, #3f6212 0%, #65a30d 100%)",
  laranja: "linear-gradient(135deg, #c2410c 0%, #d97706 100%)",
  vermelho: "linear-gradient(135deg, #b91c1c 0%, #e11d48 100%)",
  agua: "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)",
  rosa: "linear-gradient(135deg, #9d174d 0%, #db2777 100%)",
  indigo: "linear-gradient(135deg, #3730a3 0%, #2563eb 100%)",
  cinza: "linear-gradient(135deg, #334155 0%, #64748b 100%)",
} as const;
export type GradienteDash = keyof typeof GRADIENTES_DASH;
/** Paleta categórica (mesma do GraficoPainel, validada): cor fixa por entidade, na ordem. */
export const SERIES_DASH = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

/** Clareia uma cor hex (0–1) — topo dos degradês. */
export function clarear(hex: string, f = 0.35) {
  const n = parseInt(hex.replace("#", ""), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => Math.round(x + (255 - x) * f));
  return `#${c.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
const uid = () => useId().replace(/:/g, ""); // eslint-disable-line react-hooks/rules-of-hooks

// ── Pulso (batimento / ECG) ─────────────────────────────────────────────────
// Cada valor vira um batimento (o pico é proporcional ao valor); a linha fica inteira e um brilho corre por ela, como no
// monitor cardíaco; o ponto no fim pulsa. Para atividade recente (eventos por dia/hora). Respeita "reduzir movimento".
export function caminhoPulso(valores: number[], largura: number, altura: number) {
  const max = Math.max(1, ...valores);
  const meio = altura * 0.62;
  const w = largura / Math.max(1, valores.length);
  let d = `M0 ${meio}`;
  valores.forEach((v, i) => {
    const x = i * w;
    const amp = (0.32 + 0.68 * (v / max)) * (altura * 0.58);
    const p = (f: number) => (x + w * f).toFixed(1);
    d += ` L${p(0.18)} ${meio} Q${p(0.24)} ${(meio - amp * 0.12).toFixed(1)} ${p(0.3)} ${meio}`; // onda P
    d += ` L${p(0.4)} ${meio} L${p(0.45)} ${(meio + amp * 0.16).toFixed(1)}`; // Q
    d += ` L${p(0.5)} ${(meio - amp).toFixed(1)}`; // R (o pico)
    d += ` L${p(0.56)} ${(meio + amp * 0.3).toFixed(1)} L${p(0.62)} ${meio}`; // S
    d += ` Q${p(0.74)} ${(meio - amp * 0.22).toFixed(1)} ${p(0.86)} ${meio} L${p(1)} ${meio}`; // onda T
  });
  return d;
}
export function Pulso({ valores, cor = "#ffffff", altura = 54, largura = 300, brilho = true, animado = true, rotulo }: {
  valores: number[]; cor?: string; altura?: number; largura?: number; brilho?: boolean; animado?: boolean; rotulo?: string;
}) {
  const id = uid();
  const vs = valores.length ? valores : [0];
  const d = useMemo(() => caminhoPulso(vs, largura, altura), [vs.join(","), largura, altura]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} width="100%" height={altura} preserveAspectRatio="none" role="img" aria-label={rotulo ?? `Atividade: ${vs.join(", ")}`} style={{ display: "block", overflow: "visible" }}>
      <style>{`@keyframes hcPulsoVarre{0%{stroke-dashoffset:1.14}100%{stroke-dashoffset:0}}@keyframes hcPulsoBate{0%,100%{r:3.5;opacity:1}50%{r:6;opacity:.55}}@media (prefers-reduced-motion:reduce){.hc-pulso-anim{animation:none!important;opacity:0}.hc-pulso-ponto{animation:none!important}}`}</style>
      <defs>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={cor} stopOpacity={0.35} />
          <stop offset="70%" stopColor={cor} stopOpacity={0.85} />
          <stop offset="100%" stopColor={cor} stopOpacity={1} />
        </linearGradient>
        {brilho ? <filter id={`${id}-b`} x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="2.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter> : null}
      </defs>
      <path d={d} fill="none" stroke={`url(#${id}-l)`} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.75} />
      {animado ? (
        <path d={d} fill="none" stroke={cor} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
          pathLength={1} strokeDasharray="0.14 1" className="hc-pulso-anim" style={{ animation: "hcPulsoVarre 2.6s linear infinite" }} filter={brilho ? `url(#${id}-b)` : undefined} />
      ) : null}
      <circle cx={largura - 2} cy={altura * 0.62} r={3.5} fill={cor} className="hc-pulso-ponto" style={animado ? { animation: "hcPulsoBate 1.1s ease-in-out infinite" } : undefined} />
    </svg>
  );
}

/** Mini tendência (sparkline em área) para cartões pequenos e tabelas. */
export function MiniTendencia({ valores, cor = SERIES_DASH[0], altura = 36 }: { valores: number[]; cor?: string; altura?: number }) {
  const id = uid();
  const max = Math.max(1, ...valores), n = Math.max(1, valores.length - 1);
  const pts = valores.map((v, i) => `${((i / n) * 100).toFixed(2)},${(altura - 3 - (v / max) * (altura - 6)).toFixed(2)}`);
  return (
    <svg viewBox={`0 0 100 ${altura}`} width="100%" height={altura} preserveAspectRatio="none" role="img" aria-label={`Tendência: ${valores.join(", ")}`}>
      <defs><linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={cor} stopOpacity={0.35} /><stop offset="100%" stopColor={cor} stopOpacity={0} /></linearGradient></defs>
      <polygon points={`0,${altura} ${pts.join(" ")} 100,${altura}`} fill={`url(#${id}-s)`} />
      <polyline points={pts.join(" ")} fill="none" stroke={cor} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Cartão de KPI em degradê (texto branco) com o pulso opcional — mesma aparência do KpiGradiente/KpiPulso dos painéis. */
export function CartaoKpiDash({ rotulo, valor, detalhe, gradiente = "azul", icone, serie, href }: {
  rotulo: string; valor: React.ReactNode; detalhe?: React.ReactNode; gradiente?: GradienteDash; icone?: React.ReactNode; serie?: number[]; href?: string;
}) {
  const conteudo = (
    <>
      <span style={{ position: "absolute", right: -28, top: -28, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,.10)" }} />
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, position: "relative" }}>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, opacity: 0.92 }}>{rotulo}</span>
          <span style={{ display: "block", fontSize: 28, fontWeight: 800, lineHeight: 1.15, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{valor}</span>
        </span>
        {icone ? <span style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", flexShrink: 0 }}>{icone}</span> : null}
      </span>
      {serie && serie.length ? <span style={{ display: "block", marginTop: "auto", paddingTop: 8 }}><Pulso valores={serie} rotulo={`${rotulo}: atividade recente`} /></span> : null}
      {detalhe ? <span style={{ display: "block", fontSize: 12, marginTop: 4, opacity: 0.92 }}>{detalhe}</span> : null}
    </>
  );
  const estilo: React.CSSProperties = { background: GRADIENTES_DASH[gradiente], borderRadius: 14, padding: "16px 18px 12px", color: "#ffffff", boxShadow: "0 12px 28px rgba(15,23,42,.22)", position: "relative", overflow: "hidden", minHeight: serie ? 150 : 108, display: "flex", flexDirection: "column", textDecoration: "none" };
  return href ? <a href={href} style={estilo}>{conteudo}</a> : <div style={estilo}>{conteudo}</div>;
}

/** Rosca em SVG puro (sem biblioteca), total no centro e legenda com valor e %. */
export function RoscaSvg({ dados, centro, tamanho = 180 }: { dados: { nome: string; valor: number; cor?: string }[]; centro?: { valor?: string; rotulo: string }; tamanho?: number }) {
  const vis = dados.map((d, i) => ({ ...d, cor: d.cor || SERIES_DASH[i % SERIES_DASH.length] })).filter((d) => d.valor > 0);
  const total = vis.reduce((s, d) => s + d.valor, 0);
  if (!total) return <div style={{ fontSize: 13, opacity: 0.7, textAlign: "center", padding: "28px 0" }}>Sem dados no período.</div>;
  const r = 40, c = 2 * Math.PI * r, folga = vis.length > 1 ? 1.2 : 0;
  let acc = 0;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: tamanho, height: tamanho, margin: "0 auto" }}>
        <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} role="img" aria-label={vis.map((d) => `${d.nome}: ${d.valor}`).join(", ")} style={{ transform: "rotate(-90deg)" }}>
          {vis.map((d) => {
            const fat = (d.valor / total) * c;
            const el = <circle key={d.nome} cx={50} cy={50} r={r} fill="none" stroke={d.cor} strokeWidth={14} strokeDasharray={`${Math.max(0, fat - folga)} ${c}`} strokeDashoffset={-acc}><title>{`${d.nome}: ${d.valor} (${Math.round((d.valor / total) * 100)}%)`}</title></circle>;
            acc += fat;
            return el;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <strong style={{ fontSize: 22, lineHeight: 1.1 }}>{centro?.valor ?? total.toLocaleString("pt-BR")}</strong>
          <span style={{ fontSize: 11, opacity: 0.75 }}>{centro?.rotulo ?? "total"}</span>
        </div>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: "1 1 150px", display: "grid", gap: 7 }}>
        {vis.map((d) => (
          <li key={d.nome} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.cor, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nome}</span>
            <b style={{ fontVariantNumeric: "tabular-nums" }}>{d.valor.toLocaleString("pt-BR")}</b>
            <span style={{ width: 36, textAlign: "right", fontSize: 12, opacity: 0.75 }}>{Math.round((d.valor / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Barras verticais em degradê sem biblioteca (colunas em HTML): valor no topo, rótulo embaixo e a dica ao passar o mouse. */
export function BarrasSvg({ dados, cor = SERIES_DASH[0], altura = 200, formatar = (v: number) => v.toLocaleString("pt-BR") }: {
  dados: { nome: string; valor: number }[]; cor?: string; altura?: number; formatar?: (v: number) => string;
}) {
  const max = Math.max(1, ...dados.map((d) => d.valor));
  if (!dados.some((d) => d.valor)) return <div style={{ fontSize: 13, opacity: 0.7, textAlign: "center", padding: "28px 0" }}>Sem dados no período.</div>;
  return (
    <div role="img" aria-label={dados.map((d) => `${d.nome}: ${formatar(d.valor)}`).join(", ")} style={{ display: "flex", alignItems: "flex-end", gap: 8, height: altura, paddingTop: 6 }}>
      {dados.map((d) => (
        <div key={d.nome} title={`${d.nome}: ${formatar(d.valor)}`} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{d.valor ? formatar(d.valor) : ""}</span>
          <span style={{ width: "62%", maxWidth: 42, height: `${(d.valor / max) * 78}%`, minHeight: d.valor ? 4 : 0, borderRadius: "6px 6px 0 0", background: `linear-gradient(0deg, ${cor} 0%, ${clarear(cor, 0.45)} 100%)`, transition: "height .6s ease" }} />
          <span style={{ fontSize: 11, opacity: 0.7, whiteSpace: "nowrap", borderTop: "1px solid currentColor", borderTopColor: "rgba(127,127,127,.25)", width: "100%", textAlign: "center", paddingTop: 4 }}>{d.nome}</span>
        </div>
      ))}
    </div>
  );
}
