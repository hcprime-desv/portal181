import type { StatusDenuncia, StatusOperacional } from "@/types/denuncia";

// Traduz o vocabulário operacional real (o que a apuração no hcCore grava
// e filtra em cada tela — Supervisão/Análise/Apuração/Difusão) pro status
// "bonito" que o cidadão vê no /acompanhar. Não existe campo salvo com o
// vocabulário público — é sempre derivado na hora de exibir.
const MAPA: Record<StatusOperacional, StatusDenuncia> = {
  "aguardando revisão": "recebida",
  "aguardando análise": "em_analise",
  "aguardando difusão": "encaminhada",
  "difundida": "em_apuracao",
  "finalizado": "concluida",
};

export function statusPublico(statusDenuncia: StatusOperacional | string): StatusDenuncia {
  return MAPA[statusDenuncia as StatusOperacional] ?? "recebida";
}
