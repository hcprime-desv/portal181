import type { Metadata } from "next";
import { buscarBaralhoPorSlug, listarBaralhosAtivos } from "@/lib/data";
import BaralhoConteudo from "@/components/baralho/BaralhoConteudo";

// Pré-renderiza os baralhos conhecidos; um baralho novo renderiza sob
// demanda na primeira visita (servidor Node, sem export estático).
export async function generateStaticParams() {
  const baralhos = await listarBaralhosAtivos();
  return baralhos.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const baralho = await buscarBaralhoPorSlug(slug);
  return { title: baralho?.nome ?? "Baralho" };
}

export default async function BaralhoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BaralhoConteudo slug={slug} />;
}
