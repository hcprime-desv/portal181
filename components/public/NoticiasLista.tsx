"use client";

import { useEffect, useState } from "react";
import { subscribeNoticias } from "@/lib/data";
import { CartaoNoticia } from "./Cartoes";
import type { Noticia } from "@/types/conteudo";

// /noticias — mais novas primeiro, 9 por vez (como no site padrão). Começa
// com o dado do servidor (SSR) e segue ao vivo.
const POR_PAGINA = 9;

export default function NoticiasLista({ dadosIniciais }: { dadosIniciais: Noticia[] }) {
  const [noticias, setNoticias] = useState<Noticia[]>(dadosIniciais);
  const [qtd, setQtd] = useState(POR_PAGINA);
  useEffect(() => subscribeNoticias(setNoticias), []);
  return (
    <>
      <div className="grade-noticias">{noticias.slice(0, qtd).map((n) => <CartaoNoticia key={n.id} n={n} />)}</div>
      {noticias.length === 0 && <div className="notice">Nenhuma notícia publicada ainda.</div>}
      {noticias.length > qtd && (
        <div className="centro"><button type="button" className="btn btn-outline" onClick={() => setQtd((q) => q + POR_PAGINA)}>Carregar mais</button></div>
      )}
    </>
  );
}
