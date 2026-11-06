"use client";

import { useEffect, useState } from "react";
import { subscribeBaralhoPorSlug, subscribeCartasBaralho } from "@/lib/data";
import type { Baralho, CartaBaralho } from "@/types/baralho";
import BaralhoView from "./BaralhoView";
import Pagina from "@/components/public/CabecalhoPagina";

// Listener em tempo real (onSnapshot), mesmo depois do shell estático já
// ter sido gerado em build (ver generateStaticParams em
// app/(public)/baralho/[slug]/page.tsx) — uma edição no baralho ou nas
// cartas, feita no admin, aparece aqui sem precisar de novo build nem de
// recarregar a página. Só a EXISTÊNCIA do baralho (nome/slug, pra virar
// uma rota estática nova) depende de rebuild.
export default function BaralhoConteudo({ slug }: { slug: string }) {
  const [baralho, setBaralho] = useState<Baralho | null | undefined>(undefined);
  const [cartas, setCartas] = useState<CartaBaralho[]>([]);

  useEffect(() => {
    const unsub = subscribeBaralhoPorSlug(slug, setBaralho);
    return () => unsub();
  }, [slug]);

  useEffect(() => {
    if (!baralho) {
      setCartas([]);
      return;
    }
    const unsub = subscribeCartasBaralho(baralho.id, setCartas);
    return () => unsub();
  }, [baralho?.id]);

  if (baralho === undefined) {
    return <div className="container vazio">Carregando...</div>;
  }

  if (baralho === null) {
    return <div className="container vazio">Baralho não encontrado.</div>;
  }

  return (
    <Pagina chamada="Baralho" titulo={baralho.nome} resumo="Ajude a localizar. Sua informação pode fazer a diferença.">
      <BaralhoView baralho={baralho} cartas={cartas} />
    </Pagina>
  );
}
