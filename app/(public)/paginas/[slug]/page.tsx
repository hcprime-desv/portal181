import type { Metadata } from "next";
import { buscarPaginaPorSlug, listarPaginasPublicadas } from "@/lib/data";
import PaginaConteudo from "@/components/public/PaginaConteudo";

// Export estático (ver next.config.js) — mesma lógica de
// app/(public)/baralho/[slug]/page.tsx: uma página nova (ou um slug
// alterado) só aparece depois de um novo `npm run build` + reenvio dos
// arquivos. O CONTEÚDO de uma página já existente é buscado client-side
// (PaginaConteudo.tsx) e reflete sem precisar de rebuild.
export async function generateStaticParams() {
  const paginas = await listarPaginasPublicadas();
  return paginas.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pagina = await buscarPaginaPorSlug(slug);
  return { title: pagina?.titulo ?? "Página" };
}

export default async function PaginaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PaginaConteudo slug={slug} />;
}
