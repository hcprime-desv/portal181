"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Search } from "lucide-react";
import type { Baralho } from "@/types/baralho";
import type { Pagina, Configuracao } from "@/types/conteudo";
import { subscribeBaralhosAtivos, subscribePaginasPublicadas } from "@/lib/data";

// `key` aponta pro campo de visibilidade correspondente em Configuracao
// (Configurações do Portal181, no hcCore) — undefined é tratado como
// "mostrar" (ver `mostrarNoMenu` abaixo). Tipado só com as chaves
// booleanas de menu (não `keyof Configuracao` genérico) pra
// `configuracao?.[l.key]` sair `boolean | undefined`, não `string |
// boolean | undefined`.
type ChaveMenu = "menuInicio" | "menuDenuncie" | "menuProcurados" | "menuDesaparecidos" | "menuRecompensas" | "menuNoticias" | "menuSobre";

const LINKS_BASE: { href: string; label: string; key: ChaveMenu }[] = [
  { href: "/", label: "Início", key: "menuInicio" },
  { href: "/denuncie", label: "Denuncie", key: "menuDenuncie" },
  { href: "/procurados", label: "Procurados", key: "menuProcurados" },
  { href: "/desaparecidos", label: "Desaparecidos", key: "menuDesaparecidos" },
];

const LINKS_FINAL: { href: string; label: string; key: ChaveMenu }[] = [
  { href: "/recompensas", label: "Recompensas", key: "menuRecompensas" },
  { href: "/noticias", label: "Notícias", key: "menuNoticias" },
  { href: "/sobre", label: "Sobre", key: "menuSobre" },
];

const mostrarNoMenu = (v?: boolean) => v !== false;

// Item do menu principal: link direto, ou um grupo (dropdown) quando
// várias Páginas compartilham o mesmo `submenu` no hcCore (ex: "Material
// Divulgação" agrupando Cartaz 2024, Meio Ambiente...).
type ItemMenu =
  | { tipo: "link"; href: string; label: string }
  | { tipo: "grupo"; label: string; itens: { href: string; label: string }[] };

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
  // jeito — as com "Rodapé" (ou sem `local`) ficam só no Footer. Dentro
  // dessas, quem tem `submenu` preenchido vira um dropdown (agrupado por
  // esse texto); quem não tem continua como link direto, igual sempre.
  const paginasMenu = todasPaginas.filter((p) => p.local === "Menu");
  const paginasMenuDiretas = paginasMenu.filter((p) => !p.submenu);
  const gruposSubmenu = new Map<string, { href: string; label: string }[]>();
  for (const p of paginasMenu) {
    if (!p.submenu) continue;
    const itens = gruposSubmenu.get(p.submenu) ?? [];
    itens.push({ href: `/paginas/${p.slug}`, label: p.titulo });
    gruposSubmenu.set(p.submenu, itens);
  }

  const itensMenu: ItemMenu[] = [
    ...LINKS_BASE.filter((l) => mostrarNoMenu(configuracao?.[l.key])).map(
      ({ href, label }): ItemMenu => ({ tipo: "link", href, label }),
    ),
    ...(mostrarNoMenu(configuracao?.menuBaralhos)
      ? baralhos.map((b): ItemMenu => ({ tipo: "link", href: `/baralho/${b.slug}`, label: b.nome }))
      : []),
    ...(mostrarNoMenu(configuracao?.menuPaginas)
      ? [
          ...paginasMenuDiretas.map((p): ItemMenu => ({ tipo: "link", href: `/paginas/${p.slug}`, label: p.titulo })),
          ...Array.from(gruposSubmenu.entries()).map(
            ([label, itens]): ItemMenu => ({ tipo: "grupo", label, itens }),
          ),
        ]
      : []),
    ...LINKS_FINAL.filter((l) => mostrarNoMenu(configuracao?.[l.key])).map(
      ({ href, label }): ItemMenu => ({ tipo: "link", href, label }),
    ),
  ];

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <span>{configuracao?.nomeOrgao ? `Portal Oficial — ${configuracao.nomeOrgao}` : "Portal Oficial do Disque Denúncia"}</span>
          <div className="topbar-right">
            {/* GET puro pra /busca — funciona sem JS, resultado é
                Server Component (ver app/(public)/busca/page.tsx). */}
            <form action="/busca" method="get" role="search" className="topbar-busca">
              <input type="search" name="q" placeholder="Buscar no site..." aria-label="Buscar no site" />
              <button type="submit" aria-label="Buscar">
                <Search size={14} />
              </button>
            </form>
            <Link href="/acompanhar">Acompanhar denúncia</Link>
          </div>
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
            {itensMenu.map((item) =>
              item.tipo === "grupo" ? (
                // <details> nativo — abre/fecha sem precisar de estado
                // React nem listener de "clique fora" (mesma ideia da
                // busca no topbar: menos JS, funciona de qualquer jeito).
                <details key={item.label} className="nav-dropdown">
                  <summary>{item.label}</summary>
                  <div className="nav-dropdown-menu">
                    {item.itens.map((sub) => (
                      <Link key={sub.href} href={sub.href}>
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ),
            )}
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
              {itensMenu.map((item) =>
                item.tipo === "grupo" ? (
                  <div key={item.label} className="mobile-nav-grupo">
                    <span className="mobile-nav-grupo-titulo">{item.label}</span>
                    {item.itens.map((sub) => (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setOpen(false)}
                        className="py-2 pl-4 font-semibold block"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="py-2 font-semibold"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
