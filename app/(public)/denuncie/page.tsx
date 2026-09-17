import type { Metadata } from "next";
import DenunciaWizard from "@/components/denuncia/DenunciaWizard";

export const metadata: Metadata = { title: "Fazer uma Denúncia" };

export default function DenunciePage() {
  return (
    <div className="wrap">
      <div className="pagehead">
        <h1>Fazer uma Denúncia</h1>
        <p>Você não precisa se identificar. Sua informação é muito importante.</p>
      </div>
      <DenunciaWizard />
    </div>
  );
}
