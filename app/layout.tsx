import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Portal 181 — Disque Denúncia",
    template: "%s | Portal 181",
  },
  description:
    "Canal oficial de denúncia anônima, segura e protegida. Denuncie, acompanhe o protocolo e ajude a localizar procurados e desaparecidos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
