// Audiência do site (visitantes ativos agora, acessos por hora, funil de
// denúncia) — separado de PROPÓSITO de qualquer coisa que identifique o
// denunciante ou o conteúdo de uma denúncia: aqui só existem CONTAGENS
// agregadas (quantos, não quem), sem nenhum vínculo com `lib/denunciaClient.ts`
// além de "uma denúncia foi concluída" (sem protocolo, sem relato, sem
// nada). Ver hcCore: pages/components/portal181/dashboard/Dashboard.tsx
// (lê essas coleções pra montar o "Dashboard de Audiência e Denúncias").
//
// Duas coleções:
// - `audienciaSessoes/{visitanteId}` — 1 doc por visitante (reusa o id de
//   lib/visitante.ts), sobrescrito a cada heartbeat com `ultimoPing`. Não
//   cresce sem limite (mesmo visitante = mesmo doc) e não guarda histórico,
//   só o último sinal de vida — é a base do "visitantes ativos agora"
//   (filtrado por quem deu ping nos últimos ~60s, calculado no hcCore).
// - `audienciaContadores/{AAAA-MM-DD_HH}` — 1 doc por hora do dia, com
//   contadores incrementados atomicamente (nunca 1 doc por evento, senão a
//   coleção cresceria sem parar em pouco tempo de uso real).
import { criarDocComId, incrementarCampos } from "./firebase/gen";
import { obterVisitanteId } from "./visitante";

const JANELA_ATIVO_MS = 60_000;
export { JANELA_ATIVO_MS };

function chaveHoraAtual(): { chave: string; data: string; hora: number } {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10); // AAAA-MM-DD (UTC — combinar com o hcCore ao ler)
  const hora = agora.getUTCHours();
  return { chave: `${data}_${String(hora).padStart(2, "0")}`, data, hora };
}

// Chamar uma vez ao montar o layout público (ver AudienciaTracker.tsx) —
// sobrescreve o próprio doc de sessão com o timestamp de agora.
export async function registrarPing(): Promise<void> {
  try {
    const id = obterVisitanteId();
    await criarDocComId("audienciaSessoes", id, { ultimoPing: Date.now() });
  } catch {
    // Best effort — nunca deve quebrar a navegação do visitante por causa
    // de telemetria.
  }
}

export type EventoAudiencia = "acesso" | "denunciaIniciada" | "denunciaConcluida";

const CAMPO_POR_EVENTO: Record<EventoAudiencia, string> = {
  acesso: "acessos",
  denunciaIniciada: "denunciasIniciadas",
  denunciaConcluida: "denunciasConcluidas",
};

export async function registrarEvento(tipo: EventoAudiencia): Promise<void> {
  try {
    const { chave, data, hora } = chaveHoraAtual();
    await incrementarCampos("audienciaContadores", chave, { [CAMPO_POR_EVENTO[tipo]]: 1 }, { data, hora });
  } catch {
    // Best effort — idem.
  }
}
