"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribePaginasPublicadas } from "@/lib/data";
import type { Pagina, Configuracao } from "@/types/conteudo";

// paginasIniciais vem do layout (Server Component, SSR real) — mesma
// ideia de ProcuradosLista/Header. Só as páginas com `local` "Rodapé" (ou
// sem `local`, cadastradas antes desse campo existir) aparecem aqui — as
// marcadas "Menu" vão pro cabeçalho (ver Header.tsx).
export default function Footer({
  paginasIniciais,
  configuracao,
}: {
  paginasIniciais: Pagina[];
  configuracao?: Configuracao;
}) {
  const [todasPaginas, setTodasPaginas] = useState<Pagina[]>(paginasIniciais);

  useEffect(() => {
    const unsub = subscribePaginasPublicadas(setTodasPaginas);
    return () => unsub();
  }, []);

  const paginas = todasPaginas.filter((p) => (p.local ?? "Rodapé") === "Rodapé");

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div>
          <strong>{configuracao?.nomeOrgao || "PORTAL 181 | Disque Denúncia"}</strong>
          <br />
          <small>{configuracao?.textoRodape || "Sua informação pode proteger uma vida."}</small>
        </div>
        <div>
          {configuracao?.telefone || configuracao?.email ? (
            <small>
              {configuracao?.telefone && <>{configuracao.telefone}</>}
              {configuracao?.telefone && configuracao?.email && <>&nbsp;•&nbsp;</>}
              {configuracao?.email && <>{configuracao.email}</>}
            </small>
          ) : (
            <small>Anonimato &nbsp;•&nbsp; Segurança &nbsp;•&nbsp; Cidadania &nbsp;•&nbsp; Resultados</small>
          )}
        </div>
        {paginas.length > 0 && (
          <div>
            <small>
              {paginas.map((p, i) => (
                <span key={p.id}>
                  {i > 0 && <>&nbsp;•&nbsp;</>}
                  <Link href={`/paginas/${p.slug}`}>{p.titulo}</Link>
                </span>
              ))}
            </small>
          </div>
        )}
      </div>
    </footer>
  );
}
