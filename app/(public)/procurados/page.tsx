import type { Metadata } from "next";
import { listarProcurados } from "@/lib/data";
import ProcuradosLista from "@/components/public/ProcuradosLista";

export const metadata: Metadata = { title: "Procurados pela Justiça" };
// ISR: renova o HTML estático a cada 5min (crawlers/1º acesso sempre com
// conteúdo recente) — quem já está com a página aberta recebe a mudança
// na hora mesmo assim, via onSnapshot em ProcuradosLista.
export const revalidate = 300;

// Server Component: lê a lista uma vez no servidor (SSR real, com Node
// rodando — ver next.config.js) pra a página já sair com conteúdo no
// HTML. O componente client (ProcuradosLista) assume dali pra frente com
// o listener em tempo real.
export default async function ProcuradosPage() {
  const procurados = await listarProcurados();
  return (
    <div className="wrap">
      <div className="pagehead">
        <h1>Procurados pela Justiça</h1>
        <p>Ajude a localizar. Sua informação pode fazer a diferença.</p>
      </div>

      <div className="panel">
        <div className="panel-body">
          <ProcuradosLista dadosIniciais={procurados} />
        </div>
      </div>
    </div>
  );
}
