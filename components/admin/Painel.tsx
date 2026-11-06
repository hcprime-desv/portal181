"use client";

// Painel do /admin: audiência do site (visitantes agora, acessos e funil da
// denúncia nas últimas 24 h, acessos por hora) e o resumo do conteúdo. Lê
// as contagens agregadas gravadas pelo próprio site (lib/audiencia.ts) —
// nada que identifique o visitante ou o denunciante.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, Eye, FileCheck2, FilePen } from "lucide-react";
import { getAll } from "@/lib/firebase/gen";
import { JANELA_ATIVO_MS } from "@/lib/audiencia";
import { PERMISSOES } from "@/lib/admin/sessao";
import { Protegido, useTituloAdmin } from "./AdminShell";

const CONTEUDO = [
  { colecao: "noticias", rotulo: "Notícias", href: "/admin/noticias" },
  { colecao: "procurados", rotulo: "Procurados", href: "/admin/procurados" },
  { colecao: "desaparecidos", rotulo: "Desaparecidos", href: "/admin/desaparecidos" },
  { colecao: "recompensas", rotulo: "Recompensas", href: "/admin/recompensas" },
  { colecao: "resultados", rotulo: "Resultados", href: "/admin/resultados" },
  { colecao: "avisos", rotulo: "Avisos", href: "/admin/avisos" },
];

// Ouve várias coleções e devolve os documentos de cada uma.
export function useColecoes(colecoes: string[]) {
  const [dados, setDados] = useState<Record<string, any[]>>({});
  useEffect(() => {
    try {
      const subs = colecoes.map((c) => getAll(c, (docs) => setDados((d) => ({ ...d, [c]: docs }))));
      return () => subs.forEach((u) => u());
    } catch {
      return undefined;
    }
  }, [colecoes.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  return dados;
}

// O site grava por hora em UTC (chave AAAA-MM-DD_HH).
const instanteDe = (c: any) => {
  const [data, hora] = String(c.id || "").split("_");
  const t = Date.parse(`${data}T${hora}:00:00Z`);
  return Number.isNaN(t) ? null : t;
};

function Conteudo() {
  const d = useColecoes(["audienciaSessoes", "audienciaContadores", ...CONTEUDO.map((c) => c.colecao)]);
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 10_000); return () => clearInterval(t); }, []);

  const ativos = (d.audienciaSessoes ?? []).filter((s) => typeof s.ultimoPing === "number" && agora - s.ultimoPing < JANELA_ATIVO_MS).length;
  const ultimas24 = useMemo(() => {
    const porHora = new Array(24).fill(0);
    let acessos = 0, iniciadas = 0, concluidas = 0;
    for (const c of d.audienciaContadores ?? []) {
      const t = instanteDe(c);
      if (t === null || agora - t > 24 * 3600_000) continue;
      acessos += c.acessos || 0;
      iniciadas += c.denunciasIniciadas || 0;
      concluidas += c.denunciasConcluidas || 0;
      porHora[new Date(t).getHours()] += c.acessos || 0;
    }
    return { acessos, iniciadas, concluidas, porHora };
  }, [d.audienciaContadores, agora]);
  const maxHora = Math.max(1, ...ultimas24.porHora);
  const taxa = ultimas24.iniciadas ? Math.round((ultimas24.concluidas / ultimas24.iniciadas) * 100) : null;

  return (
    <>
      <div className="kpis">
        <div className="card kpi"><span className="icon-circ verde"><Activity size={22} /></span><div><strong>{ativos}</strong><span>Visitantes agora (último minuto)</span></div></div>
        <div className="card kpi"><span className="icon-circ azul"><Eye size={22} /></span><div><strong>{ultimas24.acessos}</strong><span>Páginas vistas em 24 h</span></div></div>
        <div className="card kpi"><span className="icon-circ laranja"><FilePen size={22} /></span><div><strong>{ultimas24.iniciadas}</strong><span>Denúncias iniciadas em 24 h</span></div></div>
        <div className="card kpi"><span className="icon-circ roxo"><FileCheck2 size={22} /></span><div><strong>{ultimas24.concluidas}</strong><span>{taxa === null ? "Denúncias concluídas" : `Concluídas (${taxa}% das iniciadas)`}</span></div></div>
      </div>
      <div className="adm-duas">
        <div className="card">
          <h3>Acessos por hora (últimas 24 h)</h3>
          <div className="horas" aria-label="Gráfico de acessos por hora">
            {ultimas24.porHora.map((n, h) => <div key={h} style={{ height: `${(n / maxHora) * 100}%` }} title={`${h}h: ${n} acesso(s)`} />)}
          </div>
          <div className="horas-rotulos">{ultimas24.porHora.map((_, h) => <span key={h}>{h % 3 === 0 ? `${h}h` : ""}</span>)}</div>
        </div>
        <div className="card">
          <h3>Conteúdo do site</h3>
          <div className="barras">
            {CONTEUDO.map((c) => {
              const docs = d[c.colecao] ?? [];
              const visiveis = docs.filter((x) => x.ativo !== false).length;
              return (
                <Link key={c.colecao} href={c.href} className="barra-linha">
                  <span>{c.rotulo}</span>
                  <span className="barra-trilho"><span className="barra-cheia" style={{ display: "block", width: `${docs.length ? (visiveis / docs.length) * 100 : 0}%` }} /></span>
                  <b>{visiveis}/{docs.length}</b>
                </Link>
              );
            })}
          </div>
          <p className="texto-mut" style={{ fontSize: 12.5, margin: "12px 0 0" }}>Visíveis no site / total cadastrado.</p>
        </div>
      </div>
    </>
  );
}

export default function Painel() {
  useTituloAdmin("Painel");
  return <Protegido permissao={PERMISSOES.painel}><Conteudo /></Protegido>;
}
