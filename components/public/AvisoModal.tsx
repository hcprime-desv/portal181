"use client";

import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Aviso } from "@/types/conteudo";

// Modal de entrada — só pra avisos marcados "Urgente" no hcCore (ver
// AvisosClient.tsx). Bloqueia a tela até o usuário fechar de propósito:
// é reservado pra alertas realmente críticos (ex: desaparecimento
// recente), não pra promoção/notícia comum (isso é AvisoBanner.tsx).
export default function AvisoModal({ aviso, onClose }: { aviso: Aviso; onClose: () => void }) {
  return (
    <div className="aviso-modal-overlay" onClick={onClose}>
      <div className="aviso-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="aviso-modal-close" onClick={onClose} aria-label="Fechar aviso">
          <X size={20} />
        </button>
        {aviso.imagemUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={aviso.imagemUrl} alt={aviso.titulo} className="aviso-modal-img" />
        )}
        <div className="aviso-modal-body">
          <h2>{aviso.titulo}</h2>
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{aviso.mensagem}</ReactMarkdown>
          </div>
          {aviso.linkUrl && (
            <a
              href={aviso.linkUrl}
              className="btn btn-red"
              target={aviso.linkUrl.startsWith("http") ? "_blank" : undefined}
              rel={aviso.linkUrl.startsWith("http") ? "noreferrer" : undefined}
            >
              {aviso.linkTexto || "Saiba mais"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
