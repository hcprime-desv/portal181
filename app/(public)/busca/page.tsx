import type { Metadata } from "next";
import { Search } from "lucide-react";
import { buscarConteudo } from "@/lib/busca";
import BuscaResultados from "@/components/public/BuscaResultados";
import { CabecalhoPagina, CorpoPagina } from "@/components/public/CabecalhoPagina";

export const metadata: Metadata = { title: "Busca" };

// Depende do texto digitado (searchParams): renderiza a cada acesso. O
// formulário é um GET puro para /busca — funciona até sem JavaScript.
export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const resultados = await buscarConteudo(query);
  return (
    <>
      <CabecalhoPagina chamada="Busca" titulo="Buscar no site" resumo="Notícias, procurados, desaparecidos, recompensas e páginas.">
        <form action="/busca" method="get" role="search" className="busca-form">
          <input type="search" name="q" defaultValue={query} placeholder="O que você procura?" aria-label="Buscar no site" />
          <button type="submit" className="btn btn-primary"><Search size={18} /> Buscar</button>
        </form>
      </CabecalhoPagina>
      <CorpoPagina>
        <BuscaResultados query={query} resultados={resultados} />
      </CorpoPagina>
    </>
  );
}
