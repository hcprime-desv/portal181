import type { Metadata } from "next";
import "./globals.css";
import { Inter, Poppins } from "next/font/google";
import { listarConfiguracao } from "@/lib/data";
import { botaoTemaDe, scriptTema, temaDe } from "@/lib/tema";

// Mesmo padrão do site p2pcorp: títulos em Poppins, texto em Inter; tema
// claro/escuro da Configuração do site (/admin) aplicado antes de pintar.
const titulo = Poppins({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--fonte-titulo", display: "swap" });
const texto = Inter({ subsets: ["latin"], variable: "--fonte-texto", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const c = await listarConfiguracao();
  const nome = c.nomeOrgao || "Portal 181";
  return {
    title: { default: `${nome} — Disque Denúncia`, template: `%s | ${nome}` },
    description:
      "Canal oficial de denúncia anônima, segura e protegida. Denuncie, acompanhe o protocolo e ajude a localizar procurados e desaparecidos.",
    icons: { icon: "/images/simbolo-portal181.png" },
    openGraph: { title: `${nome} — Disque Denúncia`, siteName: nome, locale: "pt_BR", type: "website" },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await listarConfiguracao();
  const tema = temaDe(c.tema);
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable}`} data-tema={tema === "claro" ? "claro" : "escuro"} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: scriptTema(tema, botaoTemaDe(c.temaBotao)) }} /></head>
      <body>{children}</body>
    </html>
  );
}
