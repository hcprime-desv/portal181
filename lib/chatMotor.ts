// Liga o chat do site (componente do monorepo, copiado por scripts/copiar-chat-site.py) ao Firebase do Portal 181.
// Tenant do chat = NEXT_PUBLIC_CHAT_PATH (o do DD360, onde roda o chatbot); sem ele, o do próprio site.
import { db } from "./firebase/client";
import { ensureAnonAuth } from "./firebase/auth";
import { uploadFile } from "./firebase/gen";
import { criarMotorSite } from "@/components/chat/motorSite";

export const motorChat = criarMotorSite({
  db,
  tenant: String(process.env.NEXT_PUBLIC_CHAT_PATH || process.env.NEXT_PUBLIC_PORTAL181_PATH),
  upload: uploadFile,
  garantirSessao: ensureAnonAuth,
  chaveLocal: "portal181_contato_chat",
});
