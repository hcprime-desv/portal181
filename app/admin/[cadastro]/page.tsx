import { notFound } from "next/navigation";
import { CadastroRota } from "@/components/admin/Cadastro";
import { CADASTROS } from "@/lib/admin/cadastros";

// /admin/noticias, /admin/procurados... — um cadastro de lib/admin/cadastros.ts.
export default async function CadastroPage({ params }: { params: Promise<{ cadastro: string }> }) {
  const { cadastro } = await params;
  if (!CADASTROS.some((c) => c.id === cadastro)) notFound();
  return <CadastroRota id={cadastro} />;
}
