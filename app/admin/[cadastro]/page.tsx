import { CadastroRota } from "@/components/admin/Cadastro";
import { SITE_ADMIN } from "@/lib/admin/site";

// /admin/<cadastro> — um cadastro de lib/admin/site.tsx (SITE_ADMIN.cadastros). Gerado para cada cadastro (site estático).
export function generateStaticParams() {
  return SITE_ADMIN.cadastros.map((c) => ({ cadastro: c.id }));
}
export const dynamicParams = false;

export default async function CadastroPage({ params }: { params: Promise<{ cadastro: string }> }) {
  const { cadastro } = await params;
  return <CadastroRota id={cadastro} />;
}
