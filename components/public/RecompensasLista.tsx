"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { subscribeRecompensas } from "@/lib/data";
import type { Recompensa } from "@/types/conteudo";
import Lightbox from "./Lightbox";

// dadosIniciais vem do Server Component (SSR real) — ver ProcuradosLista.
export default function RecompensasLista({ dadosIniciais }: { dadosIniciais: Recompensa[] }) {
  const [recompensas, setRecompensas] = useState<Recompensa[]>(dadosIniciais);
  const [fotoAmpliada, setFotoAmpliada] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeRecompensas(setRecompensas);
    return () => unsub();
  }, []);

  return (
    <div className="reward-list">
      {recompensas.map((r) => (
        <div className="reward" key={r.id}>
          <div className="photo">
            {r.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={r.fotoUrl}
                alt={r.titulo}
                className="photo-clicavel"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onClick={() => setFotoAmpliada({ src: r.fotoUrl!, alt: r.titulo })}
              />
            ) : (
              <User size={32} color="#7688a0" />
            )}
          </div>
          <div>
            <strong>{r.titulo}</strong>
            <p>{r.descricao}</p>
          </div>
          <div className="reward-value">{r.valor}</div>
          <Link href="/denuncie" className="reward-btn">
            Tenho uma informação
          </Link>
        </div>
      ))}
      {fotoAmpliada && (
        <Lightbox src={fotoAmpliada.src} alt={fotoAmpliada.alt} onClose={() => setFotoAmpliada(null)} />
      )}
    </div>
  );
}
