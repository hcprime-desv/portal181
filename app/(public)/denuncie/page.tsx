import type { Metadata } from "next";
import DenunciaWizard from "@/components/denuncia/DenunciaWizard";
import Pagina from "@/components/public/CabecalhoPagina";

export const metadata: Metadata = { title: "Fazer uma Denúncia" };

export default function DenunciePage() {
  return (
    <Pagina chamada="Denúncia anônima" titulo="Fazer uma Denúncia" resumo="Você não precisa se identificar. Sua informação é muito importante." estreito>
      <DenunciaWizard />
    </Pagina>
  );
}
