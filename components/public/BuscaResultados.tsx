"use client";

import { useState } from "react";
import Link from "next/link";
import { resumoTextoPlano, type ResultadoBusca } from "@/lib/busca";

type Aba = "noticias" | "procurados" | "desaparecidos" | "recompensas" | "paginas";

const ABAS: { chave: Aba; label: string }[] = [
  { chave: "noticias", label: "Notícias" },
  { chave: "procurados", label: "Procurados" },
  { chave: "desaparecidos", label: "Desaparecidos" },
  { chave: "recompensas", label: "Recompensas" },
  { chave: "paginas", label: "Páginas" },
];

// Nenhum destes tipos tem rota de detalhe própria (só Páginas tem
// /paginas/[slug]) — Procurados/Desaparecidos/Recompensas/Notícias vivem
// só na página de listagem (ver app/(public)/procurados|desaparecidos|
// recompensas|noticias/page.tsx), então o link do resultado vai pra lista
// inteira, não pro item específico. Gap conhecido, mesmo espírito do que
// já está documentado em CLAUDE.md sobre outras lacunas do site.
export default function BuscaResultados({ query, resultados }: { query: string; resultados: ResultadoBusca }) {
  const contagens: Record<Aba, number> = {
    noticias: resultados.noticias.length,
    procurados: resultados.procurados.length,
    desaparecidos: resultados.desaparecidos.length,
    recompensas: resultados.recompensas.length,
    paginas: resultados.paginas.length,
  };
  const totalGeral = Object.values(contagens).reduce((a, b) => a + b, 0);
  const primeiraComResultado = ABAS.find((a) => contagens[a.chave] > 0)?.chave ?? "noticias";
  const [abaAtiva, setAbaAtiva] = useState<Aba>(primeiraComResultado);

  if (!query) {
    return <p style={{ color: "var(--muted)" }}>Digite um termo no campo de busca para ver os resultados.</p>;
  }

  return (
    <div>
      <p style={{ color: "var(--muted)", marginBottom: 18 }}>
        {totalGeral > 0
          ? `${totalGeral} resultado${totalGeral > 1 ? "s" : ""} encontrado${totalGeral > 1 ? "s" : ""} para "${query}"`
          : `Nada encontrado para "${query}".`}
      </p>

      {totalGeral > 0 && (
        <>
          <div className="busca-tabs">
            {ABAS.map((a) => (
              <button
                key={a.chave}
                type="button"
                className={`busca-tab${abaAtiva === a.chave ? " busca-tab-ativa" : ""}`}
                onClick={() => setAbaAtiva(a.chave)}
                disabled={contagens[a.chave] === 0}
              >
                {a.label} ({contagens[a.chave]})
              </button>
            ))}
          </div>

          <div className="busca-lista">
            {abaAtiva === "noticias" &&
              resultados.noticias.map((n) => (
                <div className="busca-item" key={n.id}>
                  <Link href="/noticias" className="busca-item-titulo">{n.titulo}</Link>
                  {n.resumo && <p className="busca-item-resumo">{n.resumo}</p>}
                </div>
              ))}
            {abaAtiva === "procurados" &&
              resultados.procurados.map((p) => (
                <div className="busca-item" key={p.id}>
                  <Link href="/procurados" className="busca-item-titulo">{p.nome}</Link>
                  {p.motivo && <p className="busca-item-resumo">{p.motivo}</p>}
                </div>
              ))}
            {abaAtiva === "desaparecidos" &&
              resultados.desaparecidos.map((d) => (
                <div className="busca-item" key={d.id}>
                  <Link href="/desaparecidos" className="busca-item-titulo">{d.nome}</Link>
                  {d.municipio && <p className="busca-item-resumo">{d.municipio}</p>}
                </div>
              ))}
            {abaAtiva === "recompensas" &&
              resultados.recompensas.map((r) => (
                <div className="busca-item" key={r.id}>
                  <Link href="/recompensas" className="busca-item-titulo">{r.titulo}</Link>
                  {r.descricao && <p className="busca-item-resumo">{r.descricao}</p>}
                </div>
              ))}
            {abaAtiva === "paginas" &&
              resultados.paginas.map((p) => (
                <div className="busca-item" key={p.id}>
                  <Link href={`/paginas/${p.slug}`} className="busca-item-titulo">{p.titulo}</Link>
                  <p className="busca-item-resumo">{resumoTextoPlano(p.conteudo)}</p>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
