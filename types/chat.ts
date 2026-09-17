// Tipos alinhados ao schema REAL de Atendimento usado pelo hcCore/hcpesquisa
// (coleção `chats` + `messages` plana filtrada por `idChat` — sem
// fila/SLA/base de conhecimento, é uma plataforma de chat genérica). Ver
// hcpesquisa/src/features/atendimento/types.ts (referência completa) —
// aqui só o subconjunto que o widget do site usa.

export type UsuarioAtendimento = {
  id: string | null;
  nome: string | null;
  avatar: string | null;
  email: string | null;
  telefone?: string | null;
  status?: string;
  origem?: string;
  id_canal?: string;
  usuario_tipo?: string;
  created_at?: number;
  last_access?: number;
  time?: number;
};

export type Attachment = {
  name: string;
  extension: string;
  size: number;
  src: string;
  content_type: string;
  type: string; // "file"
};

export type Mensagem = {
  id: string;
  idChat: string;
  body: string | null;
  attachment?: Attachment | null;
  from_user: UsuarioAtendimento;
  viewed_at: number | null;
  created_at: number;
  userId: string;
  userCreate: string;
  prioridade: string;
  // true = quem mandou é o visitante do site (lado "app" no schema real);
  // false/ausente = é a central de atendimento.
  userFrom?: boolean;
};

export type Atendimento = {
  id: string;
  nome: string;
  origem: string;
  prioridade: string;
  status: string;
  user: UsuarioAtendimento | null;
  user_requester: UsuarioAtendimento | null;
  last_message?: Mensagem | null;
  unseen_count?: number;
  value?: string;
  created_at: number;
  viewed_at: number | null;
  novo?: "0" | "1";
  telefone?: string | null;
  email?: string | null;
  id_canal?: string;
  protocolo?: string;
  time?: number;
  id_puc?: string;
};

export const STATUS_ENCERRADOS = ["fechado", "finalizado", "engano"];

export function atendimentoEncerrado(atendimento: Atendimento): boolean {
  return STATUS_ENCERRADOS.includes((atendimento.status || "").toLowerCase());
}
