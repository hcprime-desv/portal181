import type { Metadata } from "next";
import { listarRecompensas } from "@/lib/data";
import RecompensasLista from "@/components/public/RecompensasLista";
import Pagina from "@/components/public/CabecalhoPagina";

export const metadata: Metadata = { title: "Recompensas" };
export const revalidate = 300;

export default async function RecompensasPage() {
  const recompensas = await listarRecompensas();
  return (
    <Pagina chamada="Informação que vale" titulo="Recompensas" resumo="Casos com recompensas oficialmente divulgadas.">
      <RecompensasLista dadosIniciais={recompensas} />
    </Pagina>
  );
}
