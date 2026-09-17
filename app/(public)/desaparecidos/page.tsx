import type { Metadata } from "next";
import { listarDesaparecidos } from "@/lib/data";
import DesaparecidosLista from "@/components/public/DesaparecidosLista";

export const metadata: Metadata = { title: "Pessoas Desaparecidas" };
export const revalidate = 300;

export default async function DesaparecidosPage() {
  const desaparecidos = await listarDesaparecidos();
  return (
    <div className="wrap">
      <div className="pagehead">
        <h1>Pessoas Desaparecidas</h1>
        <p>Ajude a encontrar. Compartilhe informações de forma segura.</p>
      </div>

      <div className="panel">
        <div className="panel-body">
          <DesaparecidosLista dadosIniciais={desaparecidos} />
        </div>
      </div>
    </div>
  );
}
