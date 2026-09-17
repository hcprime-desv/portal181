"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registrarPing, registrarEvento } from "@/lib/audiencia";

const INTERVALO_PING_MS = 25_000;

// Sem UI — só liga o heartbeat de presença (pro "visitantes ativos agora"
// do dashboard no hcCore) e registra 1 "acesso" por página vista. Montado
// uma vez no layout público (app/(public)/layout.tsx) — como o layout não
// remonta entre navegações internas (App Router), o "acesso" é reenviado
// via `usePathname()`, não só no mount, senão só contaria a 1ª página de
// cada visita, não cada página navegada depois.
export default function AudienciaTracker() {
  const pathname = usePathname();

  useEffect(() => {
    registrarEvento("acesso");
  }, [pathname]);

  useEffect(() => {
    registrarPing();
    const intervalo = setInterval(registrarPing, INTERVALO_PING_MS);
    return () => clearInterval(intervalo);
  }, []);

  return null;
}
