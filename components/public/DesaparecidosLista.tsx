"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { subscribeDesaparecidos } from "@/lib/data";
import type { Desaparecido } from "@/types/conteudo";
import Lightbox from "./Lightbox";

// dadosIniciais vem do Server Component (SSR real) — ver ProcuradosLista.
export default function DesaparecidosLista({ dadosIniciais }: { dadosIniciais: Desaparecido[] }) {
  const [desaparecidos, setDesaparecidos] = useState<Desaparecido[]>(dadosIniciais);
  const [fotoAmpliada, setFotoAmpliada] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeDesaparecidos(setDesaparecidos);
    return () => unsub();
  }, []);

  return (
    <>
      {desaparecidos.length === 0 && (
        <div className="notice">Nenhum registro no momento.</div>
      )}
      <div className="people-grid">
        {desaparecidos.map((p) => (
          <div className="person" key={p.id}>
            <div className="photo">
              {p.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.fotoUrl}
                  alt={p.nome}
                  className="photo-clicavel"
                                    onClick={() => setFotoAmpliada({ src: p.fotoUrl!, alt: p.nome })}
                />
              ) : (
                <User size={48} color="#7688a0" />
              )}
            </div>
            <div className="person-info">
              <strong>{p.nome}</strong>
              <p>
                {p.idade ? `${p.idade} anos · ` : ""}
                Desaparecido(a) em {p.dataDesaparecimento ?? "data não informada"}
              </p>
              <Link href={`/denuncie?desaparecidoId=${p.id}`} className="btn btn-white">
                Tenho uma informação
              </Link>
            </div>
          </div>
        ))}
      </div>
      {fotoAmpliada && (
        <Lightbox src={fotoAmpliada.src} alt={fotoAmpliada.alt} onClose={() => setFotoAmpliada(null)} />
      )}
    </>
  );
}
