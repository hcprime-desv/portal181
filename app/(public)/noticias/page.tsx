import type { Metadata } from "next";
import { listarNoticias } from "@/lib/data";
import NoticiasLista from "@/components/public/NoticiasLista";

export const metadata: Metadata = { title: "Notícias e Resultados" };
export const revalidate = 300;

export default async function NoticiasPage() {
  const noticias = await listarNoticias();
  return (
    <div className="wrap">
      <div className="pagehead">
        <h1>Notícias e Resultados</h1>
        <p>Resultados obtidos a partir de denúncias e ações das forças de segurança.</p>
      </div>

      <NoticiasLista dadosIniciais={noticias} />
    </div>
  );
}
