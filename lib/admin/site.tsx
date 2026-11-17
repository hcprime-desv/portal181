// /admin do PORTAL 181 no KIT do monorepo (15/11/2026 — antes era um /admin próprio): marca, menu, perfis e cadastros. O resto
// (moldura, login com os `usuarios` do banco do site em PBKDF2, cadastro genérico, campos, Painel, troca de senha) vem do kit
// (scripts/copiar-admin-site.py). As permissões são as MESMAS do antigo painel (menu.portal181.*): os grupos já gravados valem.
// Telas próprias do Portal 181 que continuam: Relatórios, Configuração do site, Carga de dados de teste e a audiência no Painel.
import {
  BarChart3, BookOpen, CheckCircle2, Database, FileText, Gauge, Layers, Megaphone, ScanSearch, Settings, Spade, Trophy, UserCog, UserSearch, Users,
} from "lucide-react";
import { cadastrosNucleo } from "./nucleo";
import { CADASTROS, PERFIS, PERMISSOES, ROTULOS_PERMISSAO } from "./portal181";
import type { Cadastro, SiteAdmin } from "./tipos";
import { PainelAudiencia } from "@/components/admin/PainelPortal";

export { PERMISSOES };
const CONTEUDO = [PERMISSOES.painel, PERMISSOES.noticias, PERMISSOES.procurados, PERMISSOES.desaparecidos, PERMISSOES.recompensas, PERMISSOES.resultados, PERMISSOES.avisos, PERMISSOES.baralhos, PERMISSOES.cartas, PERMISSOES.paginas];

export const SITE_ADMIN: SiteAdmin = {
  nome: "Portal 181",
  logo: "/images/logo-portal181.png",
  logoBranco: "/images/logo-portal181-branco.png",
  chaveSessao: "admin-portal181",
  modulo: "portal181",
  permissoes: ROTULOS_PERMISSAO,
  perfis: { administrador: "*", editor: CONTEUDO, auditoria: [PERMISSOES.painel, PERMISSOES.relatorios] },
  login: {
    frase: "Disque *181*: a denúncia\nque *protege* a todos.",
    destaques: [
      { icone: "🕵️", cor: "#EF4444", titulo: "Procurados", texto: "Fichas e recompensas publicadas" },
      { icone: "🔎", cor: "#3B82F6", titulo: "Desaparecidos", texto: "Fotos e informações à população" },
      { icone: "📣", cor: "#FACC15", titulo: "Avisos e notícias", texto: "Publicação na hora" },
      { icone: "🛡️", cor: "#22C55E", titulo: "Anonimato garantido", texto: "Quem denuncia nunca é exposto" },
    ],
  },
  menu: [
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
  ],
  // usuários e grupos vêm do núcleo do kit (com a validade do usuário); os demais cadastros são os do Portal 181
  cadastros: [...(CADASTROS.filter((c) => c.id !== "usuarios" && c.id !== "grupos") as unknown as Cadastro[]), ...cadastrosNucleo(ROTULOS_PERMISSAO, PERFIS)],
  PainelExtra: PainelAudiencia,
};
