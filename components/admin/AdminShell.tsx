"use client";

// Moldura do /admin: login (sem sessão), menu lateral com o que o usuário
// pode abrir, topo com o título e o usuário, e o aviso flutuante (toast).
// Mesmas cores e componentes do site (logo do Portal 181, .card, .btn...).
import Link from "next/link";
import VerificacaoSeguranca from "@/components/admin/Verificacao";
import { IBM_Plex_Sans } from "next/font/google";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  BarChart3, BookOpen, ExternalLink, FileText, Gauge, Layers, LogOut, Megaphone, Menu, Settings,
  Spade, Trophy, UserCog, UserSearch, Users, ScanSearch, Database, CheckCircle2, X,
} from "lucide-react";
import { entrar, lerSessao, pode, revalidarSessao, sair, PERMISSOES, type Sessao } from "@/lib/admin/sessao";

// Fonte das aplicações web (IBM Plex Sans): o /admin tem o mesmo visual dos painéis (admin-escuro-azul.css).
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--fonte-admin", display: "swap" });
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

// LOGIN do /admin no MESMO modelo das aplicações web (dono, 12/11/2026 — @hc/layout TelaLogin): tema escuro azul, marca,
// frase e destaques à esquerda (Portal 181), data e hora, e o cartão de acesso de vidro à direita.
const DESTAQUES_SITE = [
  { icone: "🕵️", cor: "#EF4444", titulo: "Procurados", texto: "Fichas e recompensas publicadas" },
  { icone: "🔎", cor: "#3B82F6", titulo: "Desaparecidos", texto: "Fotos e informações à população" },
  { icone: "📣", cor: "#FACC15", titulo: "Avisos e notícias", texto: "Publicação na hora" },
  { icone: "🛡️", cor: "#22C55E", titulo: "Anonimato garantido", texto: "Quem denuncia nunca é exposto" },
];
function FraseLogin({ texto }: { texto: string }) {
  return <>{texto.split("\n").map((l, i) => <span key={i}>{i ? <br /> : null}{l.split(/(\*[^*]+\*)/g).map((p, j) => (p.startsWith("*") && p.endsWith("*") ? <em key={j}>{p.slice(1, -1)}</em> : <span key={j}>{p}</span>))}</span>)}</>;
}
function RelogioLogin() {
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => { setAgora(new Date()); const t = setInterval(() => setAgora(new Date()), 1000); return () => clearInterval(t); }, []);
  if (!agora) return <div className="hcl-relogio" />;
  const dia = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
  return <div className="hcl-relogio"><small>{dia.charAt(0).toUpperCase() + dia.slice(1)}</small><b>{agora.toLocaleTimeString("pt-BR")}</b></div>;
}

function Login({ aoEntrar }: { aoEntrar: (s: Sessao) => void }) {
  const marca = { nome: "Portal 181", logo: LOGO, logoBranco: LOGO_BRANCO };
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [erro, setErro] = useState("");
  const [entrando, setEntrando] = useState(false);
  // verificação de segurança invisível (a mesma dos painéis): só entra depois de concluída
  const [verificado, setVerificado] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificado) { setErro("Aguarde a verificação de segurança (ou deslize para confirmar)."); return; }
    setEntrando(true); setErro("");
    try {
      const r = await entrar(usuario, senha);
      if (r.ok) aoEntrar(r.sessao); else { setErro(r.erro); setTentativa((t) => t + 1); }
    } catch {
      setErro("Não foi possível conectar ao banco. Tente de novo.");
    } finally {
      setEntrando(false);
    }
  };
  // Dia/noite do login (dono, 13/11/2026 — o mesmo botão e a mesma chave das aplicações web): padrão NOITE, só no navegador.
  const [noite, setNoite] = useState(true);
  useEffect(() => { try { if (localStorage.getItem("hcl-tema-login") === "dia") setNoite(false); } catch { /* sem storage */ } }, []);
  const trocarTema = () => setNoite((n) => { try { localStorage.setItem("hcl-tema-login", n ? "dia" : "noite"); } catch { /* ok */ } return !n; });
  const frase = `Disque *181*: a denúncia
que *protege* a todos.`;
  const destaques = DESTAQUES_SITE;
  return (
    <div className={`hcl-tela ${plex.variable} ${noite ? "" : "hcl-dia"}`}>
      <button type="button" className="hcl-tema" onClick={trocarTema} aria-label={noite ? "Modo dia" : "Modo noite"} title={noite ? "Modo dia" : "Modo noite"}>
        {noite ? "☀️" : "🌙"}<span>{noite ? "Dia" : "Noite"}</span>
      </button>
      <section className="hcl-esq">
        <div className="hcl-marca">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={noite ? marca.logoBranco : marca.logo} alt={marca.nome} /></div>
        <div className="hcl-meio">
          <h1><FraseLogin texto={frase} /></h1>
          <div className="hcl-destaques">
            {destaques.map((d) => <div className="hcl-dest" key={d.titulo}><i style={{ background: d.cor }}>{d.icone}</i><div><b>{d.titulo}</b><span>{d.texto}</span></div></div>)}
          </div>
        </div>
        <RelogioLogin />
      </section>
      <section className="hcl-dir">
        <div className="hcl-cartoes">
          <form className="hcl-card" onSubmit={enviar}>
            <h2 className="hcl-titulo">Acesso ao sistema</h2>
            <p className="hcl-sub">Gerenciamento do conteúdo de {marca.nome}.</p>
            <label htmlFor="adm-usuario">E-mail ou login</label>
            <input id="adm-usuario" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus placeholder="seu.usuario ou e-mail" />
            <label htmlFor="adm-senha">Senha</label>
            <div className="hcl-senha">
              <input id="adm-senha" type={ver ? "text" : "password"} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="sua senha" />
              <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? "Esconder a senha" : "Mostrar a senha"}>{ver ? "🙈" : "👁️"}</button>
            </div>
            <label>Verificação de segurança</label>
            <VerificacaoSeguranca verified={verificado} onVerifiedChange={setVerificado} resetTrigger={tentativa} />
            {erro && <div className="hcl-erro" role="alert">{erro}</div>}
            <button type="submit" className="hcl-entrar" disabled={entrando}>{entrando ? "Entrando..." : "Entrar"}</button>
            <div className="hcl-voltar"><Link href="/">← Voltar ao site</Link></div>
          </form>
          <div className="hcl-rodape"><div className="hcl-assina"><span>Tecnologia e Inovação · P2P Corp</span></div></div>
        </div>
      </section>
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

  if (sessao === undefined) return <div className={`adm-login ${plex.variable}`}><p className="texto-mut">Carregando...</p></div>;
  if (!sessao) return <Login aoEntrar={setSessao} />;

  const menu = MENU_ADMIN.map((g) => ({ ...g, itens: g.itens.filter((i) => pode(sessao, i.permissao)) })).filter((g) => g.itens.length);
  const ativo = (href: string) => (href === "/admin" ? rota === "/admin" : rota === href || rota.startsWith(href + "/"));
  return (
    <AdminCtx.Provider value={{ sessao, avisar, titulo }}>
      <div className={`adm ${plex.variable}`}>
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
