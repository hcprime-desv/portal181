import type { Metadata } from "next";
import AcompanharForm from "@/components/denuncia/AcompanharForm";
import Pagina from "@/components/public/CabecalhoPagina";

export const metadata: Metadata = { title: "Acompanhar Denúncia" };

export default function AcompanharPage() {
  return (
    <Pagina chamada="Protocolo" titulo="Acompanhar Denúncia" resumo="Consulte o andamento utilizando o protocolo e o código de segurança.">
      <AcompanharForm />
    </Pagina>
  );
}
