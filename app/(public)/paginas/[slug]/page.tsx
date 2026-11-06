import type { Metadata } from "next";
import { buscarPaginaPorSlug, listarPaginasPublicadas } from "@/lib/data";
import PaginaConteudo from "@/components/public/PaginaConteudo";

// Pré-renderiza as páginas conhecidas; uma página nova renderiza sob
// demanda na primeira visita. O conteúdo segue ao vivo (PaginaConteudo).
export async function generateStaticParams() {
  const paginas = await listarPaginasPublicadas();
  return paginas.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pagina = await buscarPaginaPorSlug(slug);
  return { title: pagina?.titulo ?? "Página" };
}

export default async function PaginaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PaginaConteudo slug={slug} />;
}
