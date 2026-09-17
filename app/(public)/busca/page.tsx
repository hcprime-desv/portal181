import type { Metadata } from "next";
import { buscarConteudo } from "@/lib/busca";
import BuscaResultados from "@/components/public/BuscaResultados";

export const metadata: Metadata = { title: "Busca" };

// Sem generateStaticParams/revalidate — a página depende de searchParams
// (query digitada), então o Next já trata como dinâmica (renderiza a cada
// request), igual a qualquer outra busca server-side.
export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const resultados = await buscarConteudo(query);

  return (
    <div className="wrap">
      <div className="pagehead">
        <h1>Busca</h1>
      </div>
      <BuscaResultados query={query} resultados={resultados} />
    </div>
  );
}
