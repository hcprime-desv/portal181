"use client";

import { X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { markdownSanitizeSchema } from "@/lib/markdownSanitize";
import type { Aviso } from "@/types/conteudo";

// Banner flutuante — formato padrão pra avisos SEM "Urgente" marcado no
// hcCore (notícia, campanha, recompensa em destaque etc.). Fica num canto
// da tela, não bloqueia a navegação nem o uso do site (ver AvisosClient.tsx).
export default function AvisoBanner({ aviso, onClose }: { aviso: Aviso; onClose: () => void }) {
  return (
    <div className="aviso-banner">
      <button type="button" className="aviso-banner-close" onClick={onClose} aria-label="Fechar aviso">
        <X size={16} />
      </button>
      {aviso.imagemUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={aviso.imagemUrl} alt="" className="aviso-banner-img" />
      )}
      <div className="aviso-banner-texto">
        <strong>{aviso.titulo}</strong>
        <div className="aviso-banner-msg markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
          >
            {aviso.mensagem}
          </ReactMarkdown>
        </div>
      </div>
      {aviso.linkUrl && (
        <a
          href={aviso.linkUrl}
          className="aviso-banner-btn"
          target={aviso.linkUrl.startsWith("http") ? "_blank" : undefined}
          rel={aviso.linkUrl.startsWith("http") ? "noreferrer" : undefined}
        >
          {aviso.linkTexto || "Saiba mais"}
        </a>
      )}
    </div>
  );
}
