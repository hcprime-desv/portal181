"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { subscribePaginaPorSlug } from "@/lib/data";
import type { Pagina } from "@/types/conteudo";

// Listener em tempo real (onSnapshot), mesmo depois do shell estático já
// ter sido gerado em build (ver generateStaticParams em
// app/(public)/paginas/[slug]/page.tsx) — uma edição no conteúdo aparece
// sem precisar de novo build nem de recarregar a página. Só a EXISTÊNCIA
// da própria página (título/slug, pra virar uma rota estática nova)
// depende de rebuild.
export default function PaginaConteudo({ slug }: { slug: string }) {
  const [pagina, setPagina] = useState<Pagina | null | undefined>(undefined);

  useEffect(() => {
    const unsub = subscribePaginaPorSlug(slug, setPagina);
    return () => unsub();
  }, [slug]);

  if (pagina === undefined) {
    return <p style={{ color: "var(--muted)" }}>Carregando...</p>;
  }

  if (pagina === null) {
    return <p style={{ color: "var(--muted)" }}>Página não encontrada.</p>;
  }

  return (
    <div className="wrap">
      <div className="pagehead">
        <h1>{pagina.titulo}</h1>
      </div>

      <div className="panel">
        <div className="panel-body markdown-body">
          {/* Textarea no admin (hcCore), sem editor visual — o texto é
              Markdown de verdade (títulos, negrito/itálico, listas, links),
              interpretado aqui. remark-gfm dá listas de tarefa/tabelas/
              strikethrough a mais. HTML embutido no texto NÃO é
              renderizado (react-markdown não usa rehype-raw) — sai como
              texto literal, não como risco de XSS. */}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{pagina.conteudo}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
