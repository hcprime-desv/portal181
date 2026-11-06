"use client";

// Cabeçalho no layout do site padrão (p2pcorp/ViaMob360 — mesmas classes:
// topbar/nav/brand/links/nav-actions): logo, menu com o item da página
// atual em azul e sublinhado, busca, tema e o botão "Denunciar"
// ("Acompanhar" fica no banner, nos cartões e no rodapé; no celular, no
// menu). O que aparece no menu vem do /admin: Configuração do site
// (ligar/desligar cada item), Baralhos ativos (submenu "Baralhos") e
// Páginas com "Exibir em: Menu" (mesmo "submenu" = um grupo).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, Search, Send, X } from "lucide-react";
import { subscribeBaralhosAtivos, subscribePaginasPublicadas } from "@/lib/data";
import { nomeDoSite, useConfiguracao } from "./AoVivo";
import { BotaoTema } from "./Tema";
import type { Baralho } from "@/types/baralho";
import type { Configuracao, Pagina } from "@/types/conteudo";

// Logo do Portal 181 (scripts/gerar-marca.py portal181), usado enquanto a
// Configuração do site não tiver logo cadastrado.
const LOGO_PADRAO = "/images/logo-portal181.png";
const LOGO_PADRAO_BRANCO = "/images/logo-portal181-branco.png";

export function LogoMarca({ branco = false }: { branco?: boolean }) {
  const c = useConfiguracao();
  const src = branco ? (c.logoUrl ? c.logoUrl : LOGO_PADRAO_BRANCO) : c.logoUrl || LOGO_PADRAO;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={nomeDoSite(c)} className={branco && c.logoUrl ? "logo-clara" : undefined} />;
}

// Logo do topo: a versão normal no tema claro e a de fundo escuro no escuro.
function LogoTopo() {
  return (
    <>
      <span className="logo-tema-claro"><LogoMarca /></span>
      <span className="logo-tema-escuro"><LogoMarca branco /></span>
    </>
  );
}

type Link_ = { href: string; rotulo: string; secao?: string };
export type ItemMenu = { tipo: "link"; link: Link_ } | { tipo: "grupo"; nome: string; itens: Link_[] };

type ChaveMenu = "menuInicio" | "menuProcurados" | "menuDesaparecidos" | "menuRecompensas" | "menuNoticias";
const mostra = (c: Configuracao, k: keyof Configuracao) => c[k] !== false; // nunca configurado = mostrar

const link = (href: string, rotulo: string): ItemMenu => ({ tipo: "link", link: { href, rotulo } });
const fixo = (c: Configuracao, k: ChaveMenu, href: string, rotulo: string): ItemMenu[] => (mostra(c, k) ? [link(href, rotulo)] : []);

// Monta o menu na ordem do Portal 181. Para caber numa linha (como no site
// padrão), o que pode crescer vira submenu: "Baralhos" e "Institucional"
// (Sobre + páginas do Menu; páginas com o mesmo "submenu" ficam juntas,
// sob o nome dele como subtítulo).
export function montarMenu(c: Configuracao, baralhos: Baralho[], paginas: Pagina[]): ItemMenu[] {
  const doMenu = mostra(c, "menuPaginas") ? paginas.filter((p) => p.local === "Menu") : [];
  const vistos = new Set<string>();
  const unico = (l: Link_) => (vistos.has(l.href) ? false : (vistos.add(l.href), true));
  const agrupadas = doMenu.filter((p) => p.submenu).sort((a, b) => a.submenu!.localeCompare(b.submenu!))
    .map((p) => ({ href: `/paginas/${p.slug}`, rotulo: p.titulo, secao: p.submenu }));
  const grupo = (nome: string, itens: Link_[]): ItemMenu[] => {
    const lista = itens.filter(unico);
    if (!lista.length) return [];
    return [lista.length === 1 ? link(lista[0].href, lista[0].rotulo) : { tipo: "grupo", nome, itens: lista }];
  };
  const institucional = [
    ...(mostra(c, "menuSobre") ? [{ href: "/sobre", rotulo: "Como funciona o 181" }] : []),
    ...doMenu.filter((p) => !p.submenu).map((p) => ({ href: `/paginas/${p.slug}`, rotulo: p.titulo })),
    ...agrupadas,
  ];
  return [
    ...fixo(c, "menuInicio", "/", "Início"),
    ...fixo(c, "menuProcurados", "/procurados", "Procurados"),
    ...fixo(c, "menuDesaparecidos", "/desaparecidos", "Desaparecidos"),
    ...(mostra(c, "menuBaralhos") ? grupo("Baralhos", baralhos.map((b) => ({ href: `/baralho/${b.slug}`, rotulo: b.nome }))) : []),
    ...fixo(c, "menuRecompensas", "/recompensas", "Recompensas"),
    ...fixo(c, "menuNoticias", "/noticias", "Notícias"),
    ...grupo("Institucional", institucional),
  ];
}

// Baralhos e páginas: SSR (vêm do layout) e depois ao vivo.
export function useMenu(baralhosIniciais: Baralho[], paginasIniciais: Pagina[]) {
  const c = useConfiguracao();
  const [baralhos, setBaralhos] = useState(baralhosIniciais);
  const [paginas, setPaginas] = useState(paginasIniciais);
  useEffect(() => subscribeBaralhosAtivos(setBaralhos), []);
  useEffect(() => subscribePaginasPublicadas(setPaginas), []);
  return { itens: montarMenu(c, baralhos, paginas), paginas };
}

// Item da página atual: "/" só na Home; os demais também nas rotas filhas.
const ehAtual = (href: string, rota: string) => (href === "/" ? rota === "/" : rota === href || rota.startsWith(href + "/"));

export default function Header({ baralhosIniciais, paginasIniciais }: { baralhosIniciais: Baralho[]; paginasIniciais: Pagina[] }) {
  const c = useConfiguracao();
  const { itens } = useMenu(baralhosIniciais, paginasIniciais);
  const rota = usePathname() || "/";
  const [aberto, setAberto] = useState(false);
  const [sub, setSub] = useState<string | null>(null);
  const fechar = () => { setAberto(false); setSub(null); };
  const classe = (href: string) => (ehAtual(href, rota) ? "ativo" : undefined);
  const denunciar = mostra(c, "menuDenuncie");
  return (
    <header className="topbar">
      <div className="container nav">
        <Link className="brand" href="/" aria-label={`${nomeDoSite(c)} — início`} onClick={fechar}><LogoTopo /></Link>
        <nav className={`links${aberto ? " aberto" : ""}`} aria-label="Menu principal">
          {itens.map((g) => g.tipo === "link" ? (
            <Link key={g.link.href} href={g.link.href} className={classe(g.link.href)} onClick={fechar}>{g.link.rotulo}</Link>
          ) : (
            <div key={g.nome} className={`menu-grupo${sub === g.nome ? " aberto" : ""}`} onMouseLeave={() => setSub(null)}>
              <button type="button" aria-expanded={sub === g.nome} onClick={() => setSub(sub === g.nome ? null : g.nome)} onMouseEnter={() => setSub(g.nome)}>
                {g.nome} <ChevronDown size={16} aria-hidden />
              </button>
              <div className="submenu">
                {g.itens.map((i, k) => (
                  <span key={i.href} style={{ display: "contents" }}>
                    {i.secao && i.secao !== g.itens[k - 1]?.secao && <span className="submenu-titulo">{i.secao}</span>}
                    <Link href={i.href} className={classe(i.href)} onClick={fechar}>{i.rotulo}</Link>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <Link href="/acompanhar" className="btn btn-outline so-mobile" onClick={fechar}>Acompanhar denúncia</Link>
          {denunciar && <Link href="/denuncie" className="btn btn-red so-mobile" onClick={fechar}><Send size={18} /> Fazer denúncia</Link>}
        </nav>
        <BotaoTema />
        <div className="nav-actions">
          <Link className="busca" href="/busca" aria-label="Buscar no site"><Search size={19} /></Link>
          {denunciar && <Link href="/denuncie" className="btn btn-red"><Send size={17} /> Denunciar</Link>}
        </div>
        <button className="menu-btn" type="button" onClick={() => setAberto((v) => !v)} aria-label={aberto ? "Fechar menu" : "Abrir menu"} aria-expanded={aberto}>
          {aberto ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
    </header>
  );
}
