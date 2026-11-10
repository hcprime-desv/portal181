"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatMotor from "./ChatMotor";
import { motorChat } from "@/lib/chatMotor";
import styles from "./ChatWidget.module.css";

export interface ChatWidgetProps {
  /** Nome exibido no cabeçalho do chat. Default: "Central de Atendimento". */
  nomeAtendente?: string;
  /** URL de um avatar (imagem) pro cabeçalho — sem isso usa um ícone genérico. */
  avatarUrl?: string;
  /** Texto do balão que aparece ao lado do botão flutuante. */
  rotuloBotao?: string;
  /** Assunto gravado no chamado quando a 1ª mensagem é enviada. */
  assuntoPadrao?: string;
  /** Mensagem mostrada antes de qualquer troca de mensagem. */
  mensagemBoasVindas?: string;
}

// Botão flutuante (canto inferior direito) que abre o chat com a Central de Atendimento. A conversa usa o MESMO MOTOR do
// WhatsApp (10/11/2026 — components/chat/ChatMotor.tsx + lib/chatMotor.ts): o chatbot do DD360 conduz (menu, formulários
// do roteiro, localização) e, no bloco Atendente, a conversa cai na mesma fila do Atendimento, com o mesmo atendente.
//
// Reutilizável em qualquer app Next.js que já siga o mesmo padrão deste
// projeto: precisa existir `@/lib/firebase/client` (db/storage do
// Firebase) e uma env `NEXT_PUBLIC_<APP>_PATH` resolvendo o tenant dentro
// de `lib/firebase/gen.ts` (copie a pasta components/chat/ + lib/chatClient.ts
// + lib/visitante.ts + types/chat.ts pro novo projeto e ajuste só esses
// dois pontos de acesso ao Firebase).
export default function ChatWidget({
  nomeAtendente = "Central de Atendimento",
  avatarUrl,
  rotuloBotao = "Fale conosco",
  assuntoPadrao = "Atendimento pelo site",
  mensagemBoasVindas,
}: ChatWidgetProps) {
  const [aberto, setAberto] = useState(false);
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  void assuntoPadrao;

  if (!pronto) return null;

  return (
    <div className={styles.wrapper}>
      {aberto && (
        <div className={styles.celular}>
          {/* Mesmo MOTOR do WhatsApp (chatbot, blocos, fila e atendente), no desenho do celular e com a cor do site */}
          <ChatMotor motor={motorChat} boasVindas={mensagemBoasVindas} corSite="var(--blue, #075fd7)"
            celular={{ nome: nomeAtendente, avatar: avatarUrl, aoFechar: () => setAberto(false), altura: 620 }} />
        </div>
      )}

      <button
        type="button"
        className={styles.botaoFlutuante}
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar chat" : "Abrir chat"}
      >
        {!aberto && <span className={styles.balao}>{rotuloBotao}</span>}
        {aberto ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
