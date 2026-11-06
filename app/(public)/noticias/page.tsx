import type { Metadata } from "next";
import { listarNoticias } from "@/lib/data";
import NoticiasLista from "@/components/public/NoticiasLista";
import Pagina from "@/components/public/CabecalhoPagina";

export const metadata: Metadata = { title: "Notícias e Resultados" };
export const revalidate = 300;

export default async function NoticiasPage() {
  const noticias = await listarNoticias();
  return (
    <Pagina chamada="Novidades" titulo="Notícias e Resultados" resumo="Resultados obtidos a partir de denúncias e ações das forças de segurança.">
      <NoticiasLista dadosIniciais={noticias} />
    </Pagina>
  );
}
