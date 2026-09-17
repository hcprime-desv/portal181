"use client";

import { useEffect, useState } from "react";
import { subscribeAvisosAtivos } from "@/lib/data";
import type { Aviso } from "@/types/conteudo";
import AvisoModal from "./AvisoModal";
import AvisoBanner from "./AvisoBanner";

// Só um modal e um banner por vez, mesmo que existam vários avisos ativos
// (o de menor `ordem` de cada formato vence — ver ordenarAvisosAtivos em
// lib/data.ts). Fechar um aviso grava o id dele no localStorage, então:
// - fechou, não vê de novo (mesmo navegador) até alguém criar um aviso
//   NOVO (id diferente) ou reativar/editar o mesmo, mudando o conteúdo;
// - um aviso novo sempre aparece pra todo mundo, mesmo quem já fechou um
//   antigo.
const CHAVE_MODAL_VISTO = (id: string) => `portal181_aviso_modal_${id}`;
const CHAVE_BANNER_FECHADO = (id: string) => `portal181_aviso_banner_${id}`;

export default function AvisosClient({ avisosIniciais }: { avisosIniciais: Aviso[] }) {
  const [avisos, setAvisos] = useState<Aviso[]>(avisosIniciais);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [bannerVisivel, setBannerVisivel] = useState(false);

  useEffect(() => {
    const unsub = subscribeAvisosAtivos(setAvisos);
    return () => unsub();
  }, []);

  const avisoModal = avisos.find((a) => a.urgente);
  const avisoBanner = avisos.find((a) => !a.urgente);

  useEffect(() => {
    if (!avisoModal) {
      setModalVisivel(false);
      return;
    }
    try {
      setModalVisivel(window.localStorage.getItem(CHAVE_MODAL_VISTO(avisoModal.id)) !== "1");
    } catch {
      setModalVisivel(true);
    }
  }, [avisoModal?.id]);

  useEffect(() => {
    if (!avisoBanner) {
      setBannerVisivel(false);
      return;
    }
    try {
      setBannerVisivel(window.localStorage.getItem(CHAVE_BANNER_FECHADO(avisoBanner.id)) !== "1");
    } catch {
      setBannerVisivel(true);
    }
  }, [avisoBanner?.id]);

  const fecharModal = () => {
    if (avisoModal) {
      try {
        window.localStorage.setItem(CHAVE_MODAL_VISTO(avisoModal.id), "1");
      } catch {
        // Storage bloqueado (aba anônima) — fecha só nesta visita, sem persistir.
      }
    }
    setModalVisivel(false);
  };

  const fecharBanner = () => {
    if (avisoBanner) {
      try {
        window.localStorage.setItem(CHAVE_BANNER_FECHADO(avisoBanner.id), "1");
      } catch {
        // idem
      }
    }
    setBannerVisivel(false);
  };

  return (
    <>
      {avisoModal && modalVisivel && <AvisoModal aviso={avisoModal} onClose={fecharModal} />}
      {avisoBanner && bannerVisivel && <AvisoBanner aviso={avisoBanner} onClose={fecharBanner} />}
    </>
  );
}
