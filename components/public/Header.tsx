"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { Baralho } from "@/types/baralho";
import type { Pagina, Configuracao } from "@/types/conteudo";
import { subscribeBaralhosAtivos, subscribePaginasPublicadas } from "@/lib/data";

const LINKS_BASE = [
  { href: "/", label: "Início" },
  { href: "/denuncie", label: "Denuncie" },
  { href: "/procurados", label: "Procurados" },
  { href: "/desaparecidos", label: "Desaparecidos" },
];

const LINKS_FINAL = [
  { href: "/recompensas", label: "Recompensas" },
  { href: "/noticias", label: "Notícias" },
  { href: "/sobre", label: "Sobre" },
];

// baralhosIniciais/paginasIniciais vêm do layout (Server Component, SSR
// real) — ver ProcuradosLista para a mesma ideia aplicada às páginas de
// conteúdo.
export default function Header({
  baralhosIniciais,
  paginasIniciais,
  configuracao,
}: {
  baralhosIniciais: Baralho[];
  paginasIniciais: Pagina[];
  configuracao?: Configuracao;
}) {
  const [open, setOpen] = useState(false);
  const [baralhos, setBaralhos] = useState<Baralho[]>(baralhosIniciais);
  const [todasPaginas, setTodasPaginas] = useState<Pagina[]>(paginasIniciais);

  useEffect(() => {
    const unsub = subscribeBaralhosAtivos(setBaralhos);
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = subscribePaginasPublicadas(setTodasPaginas);
    return () => unsub();
  }, []);

  // Baralho do Crime / Baralho Lilás / qualquer outro que o tenant tenha
  // configurado entram no menu dinamicamente — não são fixos no código
  // (ver documentacao/conceito.txt e a inspiração em disquedenuncia.ssp.ba.gov.br).
  // Páginas com `local` "Menu" (cadastradas no hcCore) entram do mesmo
  // jeito — as com "Rodapé" (ou sem `local`) ficam só no Footer.
  const paginasMenu = todasPaginas.filter((p) => p.local === "Menu");
  const links = [
    ...LINKS_BASE,
    ...baralhos.map((b) => ({ href: `/baralho/${b.slug}`, label: b.nome })),
    ...paginasMenu.map((p) => ({ href: `/paginas/${p.slug}`, label: p.titulo })),
    ...LINKS_FINAL,
  ];

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>{configuracao?.nomeOrgao ? `Portal Oficial — ${configuracao.nomeOrgao}` : "Portal Oficial do Disque Denúncia"}</span>
          <Link href="/acompanhar">Acompanhar denúncia</Link>
        </div>
      </div>

      <header className="site-header">
        <div className="wrap nav">
          <Link className="brand" href="/">
            {configuracao?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={configuracao.logoUrl} alt={configuracao.nomeOrgao || "Logo"} style={{ height: 48, width: "auto" }} />
            ) : (
              <>
                <span className="num">181</span>
                <span className="txt">
                  DISQUE
                  <br />
                  DENÚNCIA
                </span>
              </>
            )}
          </Link>

          <nav className="menu">
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="hidden max-[900px]:block"
            aria-label="Abrir menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {open && (
          <div className="wrap pb-4 hidden max-[900px]:block">
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="py-2 font-semibold"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
