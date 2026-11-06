"use client";

// Moldura do /admin: login (sem sessão), menu lateral com o que o usuário
// pode abrir, topo com o título e o usuário, e o aviso flutuante (toast).
// Mesmas cores e componentes do site (logo do Portal 181, .card, .btn...).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  BarChart3, BookOpen, ExternalLink, FileText, Gauge, Layers, LogOut, Megaphone, Menu, Settings,
  Spade, Trophy, UserCog, UserSearch, Users, ScanSearch, Database, CheckCircle2, X,
} from "lucide-react";
import { entrar, lerSessao, pode, revalidarSessao, sair, PERMISSOES, type Sessao } from "@/lib/admin/sessao";
import { BotaoTema } from "@/components/public/Tema";

type Item = { href: string; rotulo: string; permissao: string; icone: React.ReactNode };
export const MENU_ADMIN: { grupo: string; itens: Item[] }[] = [
  { grupo: "Visão geral", itens: [
    { href: "/admin", rotulo: "Painel", permissao: PERMISSOES.painel, icone: <Gauge size={18} /> },
    { href: "/admin/relatorios", rotulo: "Relatórios", permissao: PERMISSOES.relatorios, icone: <BarChart3 size={18} /> },
  ] },
  { grupo: "Conteúdo", itens: [
    { href: "/admin/noticias", rotulo: "Notícias", permissao: PERMISSOES.noticias, icone: <FileText size={18} /> },
    { href: "/admin/procurados", rotulo: "Procurados", permissao: PERMISSOES.procurados, icone: <ScanSearch size={18} /> },
    { href: "/admin/desaparecidos", rotulo: "Desaparecidos", permissao: PERMISSOES.desaparecidos, icone: <UserSearch size={18} /> },
    { href: "/admin/recompensas", rotulo: "Recompensas", permissao: PERMISSOES.recompensas, icone: <Trophy size={18} /> },
    { href: "/admin/resultados", rotulo: "Resultados", permissao: PERMISSOES.resultados, icone: <CheckCircle2 size={18} /> },
    { href: "/admin/avisos", rotulo: "Avisos", permissao: PERMISSOES.avisos, icone: <Megaphone size={18} /> },
    { href: "/admin/baralhos", rotulo: "Baralhos", permissao: PERMISSOES.baralhos, icone: <Spade size={18} /> },
    { href: "/admin/cartas", rotulo: "Cartas do baralho", permissao: PERMISSOES.cartas, icone: <Layers size={18} /> },
    { href: "/admin/paginas", rotulo: "Páginas", permissao: PERMISSOES.paginas, icone: <BookOpen size={18} /> },
  ] },
  { grupo: "Configurações", itens: [
    { href: "/admin/configuracao", rotulo: "Configuração do site", permissao: PERMISSOES.configuracao, icone: <Settings size={18} /> },
    { href: "/admin/usuarios", rotulo: "Usuários", permissao: PERMISSOES.usuarios, icone: <Users size={18} /> },
    { href: "/admin/grupos", rotulo: "Grupos de permissões", permissao: PERMISSOES.grupos, icone: <UserCog size={18} /> },
    { href: "/admin/carga", rotulo: "Carga de dados de teste", permissao: PERMISSOES.carga, icone: <Database size={18} /> },
  ] },
];

type Ctx = { sessao: Sessao | null; avisar: (texto: string, erro?: boolean) => void; titulo: (t: string) => void };
const AdminCtx = createContext<Ctx>({ sessao: null, avisar: () => {}, titulo: () => {} });
export const useAdmin = () => useContext(AdminCtx);

// Título da página no topo (cada tela chama uma vez).
export function useTituloAdmin(t: string) {
  const { titulo } = useAdmin();
  useEffect(() => titulo(t), [t, titulo]);
}

const LOGO = "/images/logo-portal181.png";
const LOGO_BRANCO = "/images/logo-portal181-branco.png";

function Login({ aoEntrar }: { aoEntrar: (s: Sessao) => void }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntrando(true); setErro("");
    try {
      const r = await entrar(usuario, senha);
      if (r.ok) aoEntrar(r.sessao); else setErro(r.erro);
    } catch {
      setErro("Não foi possível conectar ao banco. Tente de novo.");
    } finally {
      setEntrando(false);
    }
  };
  return (
    <div className="adm-login">
      <div className="card">
        <span className="logo-tema-claro">{/* eslint-disable-next-line @next/next/no-img-element */}<img className="logo" src={LOGO} alt="Portal 181" /></span>
        <span className="logo-tema-escuro">{/* eslint-disable-next-line @next/next/no-img-element */}<img className="logo" src={LOGO_BRANCO} alt="Portal 181" /></span>
        <h1>Área restrita</h1>
        <p className="sub">Gerenciamento do conteúdo do site.</p>
        <form onSubmit={enviar}>
          <div className="campo"><label htmlFor="adm-usuario">E-mail ou login</label><input id="adm-usuario" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus /></div>
          <div className="campo"><label htmlFor="adm-senha">Senha</label><input id="adm-senha" type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
          {erro && <div className="chat-erro" role="alert">{erro}</div>}
          <button type="submit" className="btn btn-primary" disabled={entrando}>{entrando ? "Entrando..." : "Entrar"}</button>
        </form>
        <div className="rodape-login"><Link href="/">Voltar ao site</Link> · Tecnologia P2P Corp</div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const rota = usePathname() || "/admin";
  const [sessao, setSessao] = useState<Sessao | null | undefined>(undefined);
  const [aberto, setAberto] = useState(false);
  const [tituloAtual, setTitulo] = useState("Painel");
  const [msg, setMsg] = useState<{ texto: string; erro: boolean } | null>(null);

  useEffect(() => {
    const s = lerSessao();
    setSessao(s);
    if (s) revalidarSessao(s).then(setSessao);
  }, []);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3500); return () => clearTimeout(t); }, [msg]);
  useEffect(() => setAberto(false), [rota]);

  const avisar = useCallback((texto: string, erro = false) => setMsg({ texto, erro }), []);
  const titulo = useCallback((t: string) => { setTitulo(t); document.title = `${t} | Admin Portal 181`; }, []);

  if (sessao === undefined) return <div className="adm-login"><p className="texto-mut">Carregando...</p></div>;
  if (!sessao) return <Login aoEntrar={setSessao} />;

  const menu = MENU_ADMIN.map((g) => ({ ...g, itens: g.itens.filter((i) => pode(sessao, i.permissao)) })).filter((g) => g.itens.length);
  const ativo = (href: string) => (href === "/admin" ? rota === "/admin" : rota === href || rota.startsWith(href + "/"));
  return (
    <AdminCtx.Provider value={{ sessao, avisar, titulo }}>
      <div className="adm">
        <div className={`adm-fundo${aberto ? " aberto" : ""}`} onClick={() => setAberto(false)} />
        <aside className={`adm-lado${aberto ? " aberto" : ""}`} aria-label="Menu do admin">
          <Link className="adm-marca" href="/admin">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_BRANCO} alt="Portal 181" />
            <small>Área restrita</small>
          </Link>
          {menu.map((g) => (
            <div key={g.grupo}>
              <div className="adm-grupo">{g.grupo}</div>
              {g.itens.map((i) => <Link key={i.href} href={i.href} className={ativo(i.href) ? "ativo" : undefined}>{i.icone} {i.rotulo}</Link>)}
            </div>
          ))}
          <div className="adm-rodape-lado">
            <a href="/" target="_blank" rel="noreferrer"><ExternalLink size={18} /> Ver o site</a>
            <button type="button" className="adm-item" onClick={() => { sair(); setSessao(null); }}><LogOut size={18} /> Sair</button>
          </div>
        </aside>
        <div className="adm-principal">
          <header className="adm-topo">
            <button type="button" className="adm-menu-btn" onClick={() => setAberto((v) => !v)} aria-label={aberto ? "Fechar menu" : "Abrir menu"}>
              {aberto ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1>{tituloAtual}</h1>
            <BotaoTema sempre />
            <div className="adm-usuario">
              <span className="nome">Olá, <b>{sessao.nome}</b></span>
              <span className="adm-avatar" aria-hidden>{(sessao.nome || "?").trim().charAt(0).toUpperCase()}</span>
            </div>
          </header>
          <main className="adm-conteudo">{children}</main>
        </div>
      </div>
      {msg && <div className={`adm-msg${msg.erro ? " erro" : ""}`} role="status">{msg.texto}</div>}
    </AdminCtx.Provider>
  );
}

// Tela que exige uma permissão (sem ela, explica em vez de mostrar).
export function Protegido({ permissao, children }: { permissao: string; children: React.ReactNode }) {
  const { sessao } = useAdmin();
  if (!pode(sessao, permissao)) return <div className="card adm-vazio">Seu grupo não tem acesso a esta tela. Fale com o administrador.</div>;
  return <>{children}</>;
}
