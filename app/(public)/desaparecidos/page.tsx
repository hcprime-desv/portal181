import type { Metadata } from "next";
import { listarDesaparecidos } from "@/lib/data";
import DesaparecidosLista from "@/components/public/DesaparecidosLista";
import Pagina from "@/components/public/CabecalhoPagina";

export const metadata: Metadata = { title: "Pessoas Desaparecidas" };
export const revalidate = 300;

export default async function DesaparecidosPage() {
  const desaparecidos = await listarDesaparecidos();
  return (
    <Pagina chamada="Ajude a encontrar" titulo="Pessoas Desaparecidas" resumo="Compartilhe informações de forma segura. Cada detalhe pode ajudar uma família.">
      <DesaparecidosLista dadosIniciais={desaparecidos} />
    </Pagina>
  );
}
