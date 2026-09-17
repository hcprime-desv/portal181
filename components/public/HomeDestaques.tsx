"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Spade } from "lucide-react";
import { subscribeNoticias, subscribeBaralhosAtivos } from "@/lib/data";
import type { Noticia } from "@/types/conteudo";
import type { Baralho } from "@/types/baralho";

// dadosIniciais vem do Server Component (SSR real) — ver ProcuradosLista.
export default function HomeDestaques({
  noticiasIniciais,
  baralhosIniciais,
}: {
  noticiasIniciais: Noticia[];
  baralhosIniciais: Baralho[];
}) {
  const [noticias, setNoticias] = useState<Noticia[]>(noticiasIniciais);
  const [baralhos, setBaralhos] = useState<Baralho[]>(baralhosIniciais);

  useEffect(() => {
    const unsubNoticias = subscribeNoticias((n) => setNoticias(n.slice(0, 4)));
    const unsubBaralhos = subscribeBaralhosAtivos(setBaralhos);
    return () => {
      unsubNoticias();
      unsubBaralhos();
    };
  }, []);

  return (
    <>
      {baralhos.length > 0 && (
        <section style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="section-title">
              <div>
                <h2>Baralhos</h2>
                <p>Pessoas procuradas organizadas por naipe.</p>
              </div>
            </div>
            <div className="cards">
              {baralhos.map((b) => (
                <Link href={`/baralho/${b.slug}`} className="card" key={b.id}>
                  <div className="icon">
                    <Spade size={22} />
                  </div>
                  <h3>{b.nome}</h3>
                  <p>Veja os {b.naipes.length} naipes deste baralho.</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-title">
            <div>
              <h2>Últimas notícias</h2>
              <p>Resultados e informações do Disque Denúncia.</p>
            </div>
            <Link href="/noticias">Ver todas</Link>
          </div>
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
        </div>
      </section>
    </>
  );
}
