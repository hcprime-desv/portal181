import type { Metadata } from "next";
import { listarRecompensas } from "@/lib/data";
import RecompensasLista from "@/components/public/RecompensasLista";

export const metadata: Metadata = { title: "Recompensas" };
export const revalidate = 300;

export default async function RecompensasPage() {
  const recompensas = await listarRecompensas();
  return (
    <div className="wrap">
      <div className="pagehead">
        <h1>Recompensas</h1>
        <p>Casos com recompensas oficialmente divulgadas.</p>
      </div>

      <RecompensasLista dadosIniciais={recompensas} />
    </div>
  );
}
