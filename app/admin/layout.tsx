import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import { AoVivoProvider } from "@/components/public/AoVivo";
import { listarConfiguracao } from "@/lib/data";

// /admin — gerenciamento do conteúdo do próprio site (substitui o antigo
// painel apps/portal181). Fora do índice dos buscadores.
export const metadata: Metadata = { title: "Área restrita", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const configuracao = await listarConfiguracao();
  return (
    <AoVivoProvider inicial={configuracao}>
      <AdminShell>{children}</AdminShell>
    </AoVivoProvider>
  );
}
