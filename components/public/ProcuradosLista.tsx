"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { subscribeProcurados } from "@/lib/data";
import type { Procurado } from "@/types/conteudo";
import Lightbox from "./Lightbox";

// `dadosIniciais` vem do Server Component (page.tsx, via listarProcurados)
// pra a primeira renderização já sair com conteúdo real no HTML (SSR/SEO).
// A partir da hidratação, o onSnapshot assume e mantém a lista atualizada
// em tempo real sem precisar de F5 — mesma função de sempre
// (subscribeProcurados), só que agora começa com dado de verdade em vez
// de null/"Carregando...".
export default function ProcuradosLista({ dadosIniciais }: { dadosIniciais: Procurado[] }) {
  const [procurados, setProcurados] = useState<Procurado[]>(dadosIniciais);
  const [fotoAmpliada, setFotoAmpliada] = useState<{ src: string; alt: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeProcurados(setProcurados);
    return () => unsub();
  }, []);

  return (
    <>
      {procurados.length === 0 && (
        <p style={{ color: "var(--muted)" }}>Nenhum procurado cadastrado no momento.</p>
      )}
      <div className="people-grid">
        {procurados.map((p) => (
          <div className="person" key={p.id}>
            <div className="photo">
              <span className="tag tag-photo">PROCURADO</span>
              {p.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.fotoUrl}
                  alt={p.nome}
                  className="photo-clicavel"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onClick={() => setFotoAmpliada({ src: p.fotoUrl!, alt: p.nome })}
                />
              ) : (
                <User size={48} color="#7688a0" />
              )}
            </div>
            <div className="person-info">
              <strong>{p.nome}</strong>
              <p style={{ margin: "3px 0 8px", color: "rgba(255,255,255,0.85)" }}>
                {p.motivo ?? "Informações oficiais disponíveis"}
                {p.municipio ? ` · ${p.municipio}` : ""}
              </p>
              <Link href={`/denuncie?procuradoId=${p.id}`} className="btn btn-outline">
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
