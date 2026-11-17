"use client";
// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/layout/src/sites/admin e copie de novo.

// /admin dos SITES — Painel (kit de dashboard do core360, 11/11/2026): um cartão em DEGRADÊ por cadastro que o usuário
// pode abrir (quantidade ao vivo + o PULSO dos últimos 14 dias), registros novos por mês (barras em degradê) e a
// divisão do conteúdo por cadastro (rosca). Gráficos sem biblioteca: components/admin/Graficos.tsx (cópia de
// packages/components/src/dashboard/svg.tsx).
import { useEffect, useMemo, useState } from "react";
import { ouvir } from "@/lib/admin/banco";
import { pode } from "@/lib/admin/sessao";
import { SITE_ADMIN } from "@/lib/admin/site";
import { useAdmin, useTituloAdmin } from "./AdminShell";
import { BarrasSvg, CartaoKpiDash, RoscaSvg, SERIES_DASH, type GradienteDash } from "./Graficos";

const CORES: GradienteDash[] = ["azul", "roxo", "agua", "laranja", "rosa", "limao", "indigo", "vermelho"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const quando = (r: any): number | null => {
  const v = r?.created_at ?? r?.criado_em ?? r?.data ?? null;
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v?.toMillis === "function") return v.toMillis();
  if (typeof v?.seconds === "number") return v.seconds * 1000;
  const n = Date.parse(String(v));
  return Number.isFinite(n) ? n : null;
};

export default function Painel() {
  useTituloAdmin("Painel");
  const { sessao } = useAdmin();
  const icones = new Map(SITE_ADMIN.menu.flatMap((g) => g.itens.map((i) => [i.href, i.icone] as const)));
  const visiveis = SITE_ADMIN.cadastros.filter((c) => !c.unico && pode(sessao, c.permissao));
  const [dados, setDados] = useState<Record<string, any[]>>({});
  const chave = visiveis.map((c) => c.colecao).join(",");
  useEffect(() => {
    const paradas = [...new Set(chave.split(",").filter(Boolean))].map((col) => {
      try { return ouvir(col, (d) => setDados((x) => ({ ...x, [col]: d }))); } catch { setDados((x) => ({ ...x, [col]: [] })); return () => {}; }
    });
    return () => paradas.forEach((p) => p());
  }, [chave]);

  const conta = useMemo(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const dia0 = hoje.getTime() - 13 * 86400000;
    const meses = Array.from({ length: 6 }, (_, i) => { const d = new Date(hoje.getFullYear(), hoje.getMonth() - (5 - i), 1); return { y: d.getFullYear(), m: d.getMonth(), nome: `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, valor: 0 }; });
    const pulso: Record<string, number[]> = {};
    for (const c of visiveis) {
      const p = Array(14).fill(0);
      for (const r of dados[c.colecao] ?? []) {
        const t = quando(r); if (t == null) continue;
        const i = Math.floor((t - dia0) / 86400000); if (i >= 0 && i < 14) p[i]++;
        const d = new Date(t); const k = meses.find((x) => x.y === d.getFullYear() && x.m === d.getMonth()); if (k) k.valor++;
      }
      pulso[c.id] = p;
    }
    return { pulso, meses: meses.map(({ nome, valor }) => ({ nome, valor })) };
  }, [dados, chave]); // eslint-disable-line react-hooks/exhaustive-deps

  const Extra = SITE_ADMIN.PainelExtra;
  const cartao: React.CSSProperties = { background: "var(--sup, #fff)", border: "1px solid var(--line, rgba(15,23,42,.1))", borderRadius: 16, padding: 18, minWidth: 0 };
  return (
    <>
      {Extra && <Extra />}
      <p className="texto-mut" style={{ margin: 0 }}>
        Tudo o que você salvar aqui aparece no site na mesma hora. O mesmo conteúdo também pode ser gerenciado pelo painel AdmSite360. O pulso mostra os registros dos últimos 14 dias.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(230px, 100%), 1fr))", gap: 14 }}>
        {visiveis.map((c, i) => (
          <CartaoKpiDash key={c.id} href={`/admin/${c.id}`} rotulo={c.titulo} valor={dados[c.colecao] ? dados[c.colecao].length.toLocaleString("pt-BR") : "…"}
            gradiente={CORES[i % CORES.length]} icone={icones.get(`/admin/${c.id}`)} serie={conta.pulso[c.id]}
            detalhe={`${(conta.pulso[c.id] ?? []).reduce((s, n) => s + n, 0)} nos últimos 14 dias`} />
        ))}
      </div>
      {visiveis.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: 14 }}>
          <section style={cartao}>
            <strong style={{ display: "block", fontSize: 15 }}>Registros novos por mês</strong>
            <span className="texto-mut" style={{ fontSize: 12 }}>Todos os cadastros do site, últimos 6 meses</span>
            <div style={{ marginTop: 12 }}><BarrasSvg dados={conta.meses} cor={SERIES_DASH[0]} /></div>
          </section>
          <section style={cartao}>
            <strong style={{ display: "block", fontSize: 15 }}>Conteúdo do site</strong>
            <span className="texto-mut" style={{ fontSize: 12 }}>Registros por cadastro</span>
            <div style={{ marginTop: 12 }}>
              <RoscaSvg dados={visiveis.map((c) => ({ nome: c.titulo, valor: (dados[c.colecao] ?? []).length }))} centro={{ rotulo: "registros" }} />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
