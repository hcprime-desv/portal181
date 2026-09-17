// Chat do visitante com a Central de Atendimento — grava no MESMO schema
// real usado pelo hcCore/hcpesquisa (coleção `chats` + `messages` plana
// filtrada por `idChat`), pra uma conversa iniciada aqui aparecer
// normalmente na fila de atendimento de um agente humano. Ver
// hcpesquisa/src/features/atendimento/api.ts (referência completa desse
// modelo) — aqui é a mesma lógica, portada de React Native pra web.
import { criarDocComId, criarDoc, atualizarDoc, getFilterOn, getAllOnce, uploadFile as uploadFileGen } from "./firebase/gen";
import { ensureAnonAuth } from "./firebase/auth";
import type { Atendimento, Attachment, Mensagem, UsuarioAtendimento } from "@/types/chat";

// Mesmo formato de protocolo do resto do sistema
// (aaaaMMdd.NNNNNN.HHmmssSSS), com "300000" marcando visualmente que o
// chamado nasceu no site público (100000 = app mobile, no hcpesquisa) —
// vira o próprio id do doc em `chats`.
function gerarProtocoloChatSite(): string {
  const now = new Date();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const pad3 = (n: number) => String(n).padStart(3, "0");
  const dateStr = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const timeStr = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}${pad3(now.getMilliseconds())}`;
  return `${dateStr}.300000.${timeStr}`;
}

function usuarioRicoVisitante(visitante: { id: string; nome: string }): UsuarioAtendimento {
  const now = Date.now();
  return {
    id: visitante.id,
    nome: visitante.nome,
    avatar: null,
    email: null,
    telefone: null,
    status: "Ativo",
    origem: "site",
    id_canal: visitante.id,
    // "externo" — visitante anônimo do site, não é servidor da secretaria
    // (diferente do app mobile, que só é usado por gente "interna").
    usuario_tipo: "externo",
    created_at: now,
    last_access: now,
    time: now,
  };
}

// PUC padrão do tenant (`dados/{tenant}/parametros`, doc com status
// "Ativo", campo `id_puc`) — sem isso o chamado é criado mas não cai na
// fila de ninguém. Mesmo mecanismo do hcpesquisa (buscarIdPucPadrao).
async function buscarIdPucPadrao(): Promise<string | undefined> {
  try {
    const parametros = await getAllOnce("parametros");
    const ativo = parametros.find((p: any) => p.status === "Ativo");
    return ativo?.id_puc;
  } catch {
    return undefined;
  }
}

export function subscribeMensagens(chatId: string, callback: (msgs: Mensagem[]) => void) {
  // Best-effort: dispara o sign-in anônimo em paralelo (não bloqueia o
  // listener) — a sessão só precisa estar pronta antes de enviar, não de
  // escutar.
  ensureAnonAuth().catch(() => {});
  return getFilterOn("messages", "idChat", chatId, "created_at", callback);
}

// Retoma a conversa em aberto do mesmo visitante (id persistido em
// localStorage, ver lib/visitante.ts) entre recarregamentos de página —
// sem isso, cada F5 abriria um chamado novo, perdendo o histórico visual
// (os dados continuam no Firestore, só a tela não saberia qual mostrar).
export async function buscarAtendimentoAtivo(visitanteId: string): Promise<Atendimento | null> {
  await ensureAnonAuth();
  const todos = (await getAllOnce("chats")) as Atendimento[];
  const meus = todos.filter(
    (c) => c.id_canal === visitanteId && !["fechado", "finalizado", "engano"].includes((c.status || "").toLowerCase()),
  );
  meus.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  return meus[0] ?? null;
}

export async function criarAtendimento(
  visitante: { id: string; nome: string },
  assunto: string,
): Promise<Atendimento> {
  await ensureAnonAuth();
  const protocolo = gerarProtocoloChatSite();
  const usuarioRico = usuarioRicoVisitante(visitante);
  const now = Date.now();
  const idPuc = await buscarIdPucPadrao();

  const doc: Atendimento = {
    id: protocolo,
    nome: assunto,
    origem: "site",
    prioridade: "Média",
    status: "novo",
    user: usuarioRico,
    user_requester: usuarioRico,
    last_message: null,
    unseen_count: 0,
    value: assunto,
    created_at: now,
    viewed_at: null,
    novo: "0",
    telefone: null,
    email: null,
    id_canal: visitante.id,
    protocolo,
    time: now,
    ...(idPuc ? { id_puc: idPuc } : {}),
  };

  await criarDocComId("chats", protocolo, doc);
  return doc;
}

async function persistirMensagem(atendimento: Atendimento, mensagem: Omit<Mensagem, "id">) {
  await criarDoc("messages", mensagem);
  const now = Date.now();
  await atualizarDoc("chats", atendimento.id, {
    last_message: mensagem,
    unseen_count: (atendimento.unseen_count || 0) + 1,
    viewed_at: now,
    time: now,
  });
}

export async function enviarMensagem(
  atendimento: Atendimento,
  visitante: { id: string; nome: string },
  body: string,
): Promise<void> {
  await ensureAnonAuth();
  const from_user = usuarioRicoVisitante(visitante);
  await persistirMensagem(atendimento, {
    idChat: atendimento.id,
    body,
    attachment: null,
    from_user,
    viewed_at: null,
    created_at: Date.now(),
    userId: visitante.id,
    userCreate: visitante.nome,
    prioridade: "",
    userFrom: true,
  });
}

export async function enviarMidia(
  atendimento: Atendimento,
  visitante: { id: string; nome: string },
  file: File,
): Promise<void> {
  await ensureAnonAuth();
  const url = await uploadFileGen(file);
  const attachment: Attachment = {
    name: file.name,
    extension: (file.type.split("/")[1] || "").toLowerCase(),
    size: file.size,
    src: url,
    content_type: file.type || "application/octet-stream",
    type: "file",
  };
  const from_user = usuarioRicoVisitante(visitante);
  await persistirMensagem(atendimento, {
    idChat: atendimento.id,
    body: file.name,
    attachment,
    from_user,
    viewed_at: null,
    created_at: Date.now(),
    userId: visitante.id,
    userCreate: visitante.nome,
    prioridade: "",
    userFrom: true,
  });
}

// Mesmo formato do app mobile (hcpesquisa/src/features/atendimento/api.ts
// #enviarLocalizacao): sem Storage, `attachment.src` guarda "lat,lng" puro
// e `type:"location"` marca o formato — mantém compatível com qualquer
// tela que um dia renderize isso do lado do hcCore.
export async function enviarLocalizacao(
  atendimento: Atendimento,
  visitante: { id: string; nome: string },
  coords: { latitude: number; longitude: number },
): Promise<void> {
  await ensureAnonAuth();
  const attachment: Attachment = {
    name: "Localização",
    extension: "",
    size: 0,
    src: `${coords.latitude},${coords.longitude}`,
    content_type: "application/vnd.geo",
    type: "location",
  };
  const from_user = usuarioRicoVisitante(visitante);
  await persistirMensagem(atendimento, {
    idChat: atendimento.id,
    body: "Localização",
    attachment,
    from_user,
    viewed_at: null,
    created_at: Date.now(),
    userId: visitante.id,
    userCreate: visitante.nome,
    prioridade: "",
    userFrom: true,
  });
}
