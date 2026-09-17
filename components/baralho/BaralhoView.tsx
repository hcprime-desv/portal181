"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import type { Baralho, CartaBaralho } from "@/types/baralho";
import NaipeIcon, { corNaipe } from "./NaipeIcon";
import Lightbox from "@/components/public/Lightbox";

export default function BaralhoView({
  baralho,
  cartas,
}: {
  baralho: Baralho;
  cartas: CartaBaralho[];
}) {
  const [naipeAtivo, setNaipeAtivo] = useState<string | "todos">("todos");
  const [fotoAmpliada, setFotoAmpliada] = useState<{ src: string; alt: string } | null>(null);

  const cartasFiltradas =
    naipeAtivo === "todos" ? cartas : cartas.filter((c) => c.naipe === naipeAtivo);

  return (
    <>
      <div className="suit-tabs">
        <button
          type="button"
          className="suit-tab"
          data-active={naipeAtivo === "todos"}
          onClick={() => setNaipeAtivo("todos")}
        >
          Todos ({cartas.length})
        </button>
        {baralho.naipes.map((naipe) => (
          <button
            key={naipe}
            type="button"
            className="suit-tab"
            data-active={naipeAtivo === naipe}
            onClick={() => setNaipeAtivo(naipe)}
          >
            <NaipeIcon naipe={naipe} />
            {naipe.charAt(0).toUpperCase() + naipe.slice(1)}
          </button>
        ))}
      </div>

      {cartasFiltradas.length === 0 && (
        <p style={{ color: "var(--muted)" }}>Nenhuma carta cadastrada neste naipe ainda.</p>
      )}

      <div className="cards-grid">
        {cartasFiltradas.map((carta) => (
          <div key={carta.id} className="playing-card">
            <span className={`valor suit-${corNaipe(carta.naipe)}`}>
              {carta.valor} <NaipeIcon naipe={carta.naipe} />
            </span>
            <div className="foto">
              {carta.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={carta.fotoUrl}
                  alt={carta.nome ?? ""}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
                  onClick={() => setFotoAmpliada({ src: carta.fotoUrl!, alt: carta.nome ?? "" })}
                />
              ) : (
                <User size={36} color="#7688a0" />
              )}
            </div>
            <span className="nome">{carta.nome ?? "Não identificado"}</span>
            <Link
              href={carta.procuradoId ? `/denuncie?procuradoId=${carta.procuradoId}` : "/denuncie"}
              className="playing-card-btn"
            >
              Tenho uma informação
            </Link>
          </div>
        ))}
      </div>

      {fotoAmpliada && (
        <Lightbox src={fotoAmpliada.src} alt={fotoAmpliada.alt} onClose={() => setFotoAmpliada(null)} />
      )}
    </>
  );
}
