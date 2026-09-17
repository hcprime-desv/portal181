"use client";

import { useEffect, useState } from "react";
import { subscribeNoticias } from "@/lib/data";
import type { Noticia } from "@/types/conteudo";

// dadosIniciais vem do Server Component (SSR real) — ver ProcuradosLista.
export default function NoticiasLista({ dadosIniciais }: { dadosIniciais: Noticia[] }) {
  const [noticias, setNoticias] = useState<Noticia[]>(dadosIniciais);

  useEffect(() => {
    const unsub = subscribeNoticias(setNoticias);
    return () => unsub();
  }, []);

  return (
    <div className="news">
      {noticias.map((n) => (
        <div className="card" key={n.id}>
          {n.imagemUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={n.imagemUrl}
              alt={n.titulo}
              className="thumb"
              style={{ width: "100%", objectFit: "cover" }}
            />
          ) : (
            <div className="thumb" />
          )}
          <h4>{n.titulo}</h4>
          <small>{n.data}</small>
        </div>
      ))}
    </div>
  );
}
