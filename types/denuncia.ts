// Status "público" (citizen-facing) — usado só pela barra de progresso do
// /acompanhar. Não existe no schema operacional do hcCore (que usa
// `status`/`status_denuncia` com outro vocabulário, ver StatusOperacional
// abaixo) — é derivado de `status_denuncia` na hora de exibir, não gravado
// direto. Ver lib/statusDenuncia.ts.
export type StatusDenuncia =
  | "recebida"
  | "em_analise"
  | "encaminhada"
  | "em_apuracao"
  | "concluida";

// Vocabulário real gravado no Firestore, o mesmo que a apuração
// operacional do hcCore usa e filtra em cada tela (Supervisão/Análise/
// Apuração/Difusão) — ver
// hcCore/src/components/disquedenuncia/chat/Denuncia.tsx#handleSalvar.
// Sem isso, uma denúncia registrada aqui nunca apareceria em nenhuma tela
// de apuração (elas filtram por `status_denuncia`, não por um status
// "bonito" inventado pelo site).
export type StatusOperacional =
  | "aguardando revisão"
  | "aguardando análise"
  | "aguardando difusão"
  | "difundida"
  | "finalizado";

export interface EnvolvidoDenuncia {
  nome?: string;
  apelido?: string;
  caracteristicas?: string;
  telefone?: string;
  redeSocial?: string;
}

export interface VeiculoDenuncia {
  placa?: string;
  modelo?: string;
  cor?: string;
  caracteristicas?: string;
}

// Mesmo shape do doc gravado em dados/{tenant}/anexos pela apuração
// operacional (id, idDenuncia, nome, tipo, tamanho, dataUpload, url) —
// aqui embutido dentro do próprio registro de denúncia (o site não
// precisa de uma coleção separada, só o hcCore consome anexos daquele
// jeito hoje).
export interface AnexoDenuncia {
  nome: string;
  tipo: string; // MIME type do arquivo (ex: "image/jpeg") — igual ao que hcCore grava
  tamanho: string; // formatado, ex: "1.2 MB" — mesmo formatBytes() do hcCore
  url: string;
  dataUpload: number;
}

export interface DenunciaInput {
  // Nome da natureza da denúncia — mesmo conceito/tabela usada pela
  // apuração operacional no hcCore (dados/{tenant}/natureza), não uma
  // "categoria" própria do site. Ver lib/data.ts#listarNaturezas.
  natureza: string;
  relato: string;
  municipio?: string;
  bairro?: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
  envolvidos?: EnvolvidoDenuncia[];
  veiculos?: VeiculoDenuncia[];
  anexos?: AnexoDenuncia[];
  procuradoId?: string;
  desaparecidoId?: string;
}

export interface DenunciaRegistro extends DenunciaInput {
  // Sem campo `protocolo` separado — o protocolo É o id do documento
  // (ver lib/protocolo.ts), igual ao padrão do resto do sistema (que só
  // tem `id`, não um campo duplicado). Ao ler o doc, use sempre o `id`
  // que `getDocOnce`/`getAllOnce` já devolvem.
  //
  // Sem código de segurança — a coleção `denuncias` já é de leitura
  // pública por decisão consciente (ver firestore.rules), então um
  // código "secreto" não protegia nada de verdade, só dava fricção.
  // `/acompanhar` agora busca só pelo protocolo, atrás de um captcha
  // (components/common/Captcha.tsx) pra desencorajar bot de varredura,
  // não pra proteger um segredo pessoal.

  // ── Campos operacionais (mesmo shape do hcCore) ─────────────────────
  // "novo" fixo na criação, igual ao handleSalvar do hcCore — o valor
  // "público" (StatusDenuncia) é derivado de `status_denuncia`, nunca
  // gravado igual ao antigo enum.
  status: "novo";
  status_denuncia: StatusOperacional;
  origem: "portal181";
  created_at: number;
  status_at: number;
  viewed_at: null;
  update_at: null;
  time: number;
  // Campos dinâmicos específicos da natureza (Natureza.fields, ver
  // hcCore) — o wizard público não coleta isso ainda (não tem UI pra
  // campos dinâmicos por natureza), fica vazio por enquanto.
  dados: Record<string, any>;
  dinamicos: Record<string, any>;
  tags: string[];

  // ── Campos do site (tracker público via protocolo+código) ───────────
  criadaEm: number;
  atualizadaEm: number;
  historico: { status: StatusDenuncia; data: number; observacao?: string }[];
  complementos?: { texto: string; data: number }[];
}
