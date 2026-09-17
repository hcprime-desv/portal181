import type { Metadata } from "next";
import { buscarBaralhoPorSlug, listarBaralhosAtivos } from "@/lib/data";
import BaralhoConteudo from "@/components/baralho/BaralhoConteudo";

// Export estático (ver next.config.js) — rotas dinâmicas precisam de
// TODOS os valores possíveis conhecidos em build. Isso significa: um
// baralho novo (ou um slug alterado) só aparece depois de um novo
// `npm run build` + reenvio dos arquivos pro HostGator. O CONTEÚDO
// (cartas) de um baralho já existente, em compensação, é buscado
// client-side (BaralhoConteudo.tsx) e reflete sem precisar de rebuild.
export async function generateStaticParams() {
  const baralhos = await listarBaralhosAtivos();
  return baralhos.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baralho = await buscarBaralhoPorSlug(slug);
  return { title: baralho?.nome ?? "Baralho" };
}

export default async function BaralhoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <BaralhoConteudo slug={slug} />;
}
