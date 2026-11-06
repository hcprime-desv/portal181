// Login e permissões do /admin — os MESMOS usuários dos painéis do core360:
// dados/{tenant}/usuarios (login ou e-mail + senha PBKDF2 conferida pelo
// lib/compartilhado/senhas, cópia do @hc/nucleo), grupo de permissões em `grupo` (campo `permissions`) e
// `nivel` "99" = administrador (vê tudo). As chaves de permissão são as do
// antigo painel apps/portal181 (menu.portal181.*), então os grupos já
// gravados continuam valendo.
//
// Atenção: como em todos os painéis do ecossistema (sem Firebase Auth), a
// verificação acontece no navegador e o Firestore aceita escrita em
// dados/{tenant}/**. Ver firestore.rules e o CLAUDE.md do site.
import { conferirSenha, normalizarEmail } from "@/lib/compartilhado/senhas";
import { getDocOnce, getFilterOnce, salvarAlteracao, salvarNovo } from "@/lib/firebase/gen";

export const PERMISSOES = {
  painel: "menu.portal181.dashboard",
  noticias: "menu.portal181.noticias",
  procurados: "menu.portal181.procurados",
  desaparecidos: "menu.portal181.desaparecidos",
  recompensas: "menu.portal181.recompensas",
  resultados: "menu.portal181.resultados",
  avisos: "menu.portal181.avisos",
  baralhos: "menu.portal181.baralhos",
  cartas: "menu.portal181.baralhoCartas",
  paginas: "menu.portal181.paginas",
  relatorios: "menu.portal181.relatorios",
  configuracao: "menu.portal181.configuracoes",
  carga: "menu.portal181.cargaDados",
  usuarios: "menu.configuracoes.login",
  grupos: "menu.grupo",
} as const;

// Rótulos para a tela de Grupos (marcar o que cada grupo pode abrir).
export const ROTULOS_PERMISSAO: Record<string, string> = {
  [PERMISSOES.painel]: "Painel (audiência)",
  [PERMISSOES.noticias]: "Notícias",
  [PERMISSOES.procurados]: "Procurados",
  [PERMISSOES.desaparecidos]: "Desaparecidos",
  [PERMISSOES.recompensas]: "Recompensas",
  [PERMISSOES.resultados]: "Resultados",
  [PERMISSOES.avisos]: "Avisos (pop-up e banner)",
  [PERMISSOES.baralhos]: "Baralhos",
  [PERMISSOES.cartas]: "Cartas do baralho",
  [PERMISSOES.paginas]: "Páginas",
  [PERMISSOES.relatorios]: "Relatórios",
  [PERMISSOES.configuracao]: "Configuração do site",
  [PERMISSOES.carga]: "Carga de dados de teste",
  [PERMISSOES.usuarios]: "Usuários",
  [PERMISSOES.grupos]: "Grupos de permissões",
};

export type Sessao = { id: string; nome: string; login: string; admin: boolean; permissoes: string[]; expira: number };

const CHAVE = "admin-portal181";
const DURACAO = 12 * 60 * 60 * 1000; // 12 h

export function lerSessao(): Sessao | null {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE) || "null") as Sessao | null;
    return s && s.expira > Date.now() ? s : null;
  } catch {
    return null;
  }
}

function gravarSessao(s: Sessao | null) {
  try {
    if (s) localStorage.setItem(CHAVE, JSON.stringify(s));
    else localStorage.removeItem(CHAVE);
  } catch { /* navegador sem storage: a sessão dura só esta aba */ }
}

export const sair = () => gravarSessao(null);

export const pode = (s: Sessao | null, permissao: string) => !!s && (s.admin || s.permissoes.includes(permissao));

const ehAdmin = (u: any) => String(u.nivel) === "99" || u.perfil === "administrador";

async function permissoesDe(u: any): Promise<string[]> {
  const proprias: string[] = Array.isArray(u.permissions) ? u.permissions : [];
  if (!u.id_grupo) return proprias;
  const grupo = await getDocOnce("grupo", String(u.id_grupo)).catch(() => null);
  const doGrupo: string[] = grupo && grupo.status !== "Inativo" && Array.isArray(grupo.permissions) ? grupo.permissions : [];
  return [...new Set([...proprias, ...doGrupo])];
}

async function montarSessao(u: any): Promise<Sessao> {
  return { id: String(u.id), nome: u.nome || u.login, login: u.login || u.email, admin: ehAdmin(u), permissoes: await permissoesDe(u), expira: Date.now() + DURACAO };
}

// Mesmas regras e mensagens do login dos painéis (@hc/components/acesso/loginPainel).
export async function entrar(identificador: string, senha: string): Promise<{ ok: true; sessao: Sessao } | { ok: false; erro: string }> {
  const id = normalizarEmail(identificador);
  if (!id || !senha) return { ok: false, erro: "Informe o e-mail (ou login) e a senha." };
  const u = (await getFilterOnce("usuarios", "email", id))[0] ?? (await getFilterOnce("usuarios", "login", id))[0];
  if (!u) return { ok: false, erro: "Usuário não encontrado. Verifique o e-mail ou login." };
  if (!u.senha_hash) return { ok: false, erro: "Este usuário ainda não tem senha. Peça ao administrador para definir a senha." };
  if (!(await conferirSenha(senha, u))) return { ok: false, erro: "Senha incorreta." };
  if (u.status === "bloqueado") return { ok: false, erro: "Usuário bloqueado. Entre em contato com o administrador." };
  if (u.status !== "ativo") return { ok: false, erro: "Usuário desativado. Entre em contato com o administrador." };
  const sessao = await montarSessao(u);
  gravarSessao(sessao);
  await salvarAlteracao("usuarios", sessao.id, { ultimo_acesso_em: Date.now() }).catch(() => {});
  registrarAuditoria(sessao, { colecao: "usuarios", id_registro: sessao.id, acao: "login", descricao: "Entrada no /admin do site" });
  return { ok: true, sessao };
}

// Ao abrir o /admin: confere de novo o usuário (desativado/bloqueado sai na
// hora) e atualiza as permissões do grupo.
export async function revalidarSessao(s: Sessao): Promise<Sessao | null> {
  const u = await getDocOnce("usuarios", s.id).catch(() => undefined);
  if (u === undefined) return s; // sem rede: mantém
  if (!u || u.status !== "ativo") { gravarSessao(null); return null; }
  const nova = { ...(await montarSessao(u)), expira: s.expira };
  gravarSessao(nova);
  return nova;
}

// Trilha de auditoria no formato dos painéis (coleção `logs_auditoria`).
// Nunca derruba a operação principal; senha/hash nunca vão para a trilha.
const SENSIVEIS = ["senha", "senha_hash", "senha_salt", "senha_iteracoes"];
const semSensiveis = (d?: Record<string, any> | null) =>
  d ? Object.fromEntries(Object.entries(d).filter(([k, v]) => v !== undefined && k !== "id" && !SENSIVEIS.includes(k))) : null;

export async function registrarAuditoria(s: Sessao | null, p: {
  colecao: string; id_registro: string; acao: "criacao" | "alteracao" | "exclusao" | "login" | "outro"; descricao?: string;
  dados_anteriores?: Record<string, any> | null; dados_novos?: Record<string, any> | null;
}): Promise<void> {
  try {
    await salvarNovo("logs_auditoria", {
      id_usuarios: s?.id ?? null,
      usuario_nome: s?.nome ?? "Sistema",
      modulo: "portal181",
      colecao: p.colecao,
      id_registro: String(p.id_registro),
      acao: p.acao,
      descricao: p.descricao ?? "",
      dados_anteriores: semSensiveis(p.dados_anteriores),
      dados_novos: semSensiveis(p.dados_novos),
      origem: "painel_web",
    });
  } catch (erro) {
    console.error("Erro ao gravar a auditoria", erro);
  }
}
