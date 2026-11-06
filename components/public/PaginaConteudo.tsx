"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { subscribePaginaPorSlug } from "@/lib/data";
import { markdownSanitizeSchema } from "@/lib/markdownSanitize";
import type { Pagina } from "@/types/conteudo";
import { CabecalhoPagina, CorpoPagina } from "./CabecalhoPagina";

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
    return <div className="container vazio">Carregando...</div>;
  }

  if (pagina === null) {
    return <div className="container vazio">Esta página não está mais publicada.</div>;
  }

  return (
    <>
      <CabecalhoPagina titulo={pagina.titulo} />
      <CorpoPagina estreito>
      {pagina.imagemUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pagina.imagemUrl} alt={pagina.titulo} className="pagina-img" />
      )}

        <div className="markdown-body">
          {/* Editor do /admin (Markdown com pré-visualização) — o texto é
              Markdown de verdade (títulos, negrito/itálico, listas, links),
              interpretado aqui. remark-gfm dá listas de tarefa/tabelas/
              strikethrough a mais. HTML embutido no texto (ex: <details>/
              <summary> pra seção recolhível) É renderizado via rehype-raw,
              mas sempre passando por rehype-sanitize (ver
              lib/markdownSanitize.ts) — só uma lista de tags seguras é
              permitida, tags como script/iframe e atributos "on..." (onclick
              etc.) são removidos mesmo que apareçam no texto. */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
          >
            {pagina.conteudo}
          </ReactMarkdown>

          {pagina.linkUrl && (
            <a
              href={pagina.linkUrl}
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              target={pagina.linkUrl.startsWith("http") ? "_blank" : undefined}
              rel={pagina.linkUrl.startsWith("http") ? "noreferrer" : undefined}
            >
              {pagina.linkTexto || "Saiba mais"}
            </a>
          )}
        </div>
      </CorpoPagina>
    </>
  );
}
