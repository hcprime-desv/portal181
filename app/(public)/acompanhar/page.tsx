import type { Metadata } from "next";
import AcompanharForm from "@/components/denuncia/AcompanharForm";

export const metadata: Metadata = { title: "Acompanhar Denúncia" };

export default function AcompanharPage() {
  return (
    <div className="wrap">
      <div className="pagehead">
        <h1>Acompanhar Denúncia</h1>
        <p>Consulte o andamento utilizando protocolo e código de segurança.</p>
      </div>
      <AcompanharForm />
    </div>
  );
}
