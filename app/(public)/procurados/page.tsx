import type { Metadata } from "next";
import { listarProcurados } from "@/lib/data";
import ProcuradosLista from "@/components/public/ProcuradosLista";
import Pagina from "@/components/public/CabecalhoPagina";

export const metadata: Metadata = { title: "Procurados pela Justiça" };
// ISR a cada 5 min; quem está com a página aberta recebe a mudança na hora (onSnapshot).
export const revalidate = 300;

export default async function ProcuradosPage() {
  const procurados = await listarProcurados();
  return (
    <Pagina chamada="Ajude a localizar" titulo="Procurados pela Justiça" resumo="Sua informação pode fazer a diferença. Você não precisa se identificar.">
      <ProcuradosLista dadosIniciais={procurados} />
    </Pagina>
  );
}
