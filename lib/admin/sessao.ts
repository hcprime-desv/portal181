// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/layout/src/sites/admin e copie de novo.
// /admin dos SITES — login e permissões: os MESMOS usuários do painel que gerencia o site (admsite360 ou core360):
// <banco do site>/usuarios (e-mail ou login + senha PBKDF2, lib/admin/senhas = cópia do @hc/nucleo). Permissões =
// as do usuário + as do grupo (`grupo.permissions`) + as do PERFIL (SITE_ADMIN.perfis); administrador ou nível "99" vê tudo.
// As chaves são as do admsite360 (menu.site.*), então perfis e grupos criados lá valem aqui.
import { BYTES_SALT, conferirSenha, gerarHashSenha, normalizarEmail, problemaSenhaUsuario } from "./senhas";
import { alterar, criar, filtrar, lerDoc } from "./banco";
import { SITE_ADMIN } from "./site";
import { problemaValidade } from "./validade";
import { getApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

// FIREBASE AUTH (dono, 17/11/2026 — Auth em todos os painéis, sites e apps): a senha continua conferida aqui (PBKDF2) e a sessão
// do Firebase Auth é aberta junto — o back-end do produto leva a senha cifrada ao Auth (authSync); se a conta ainda não estiver
// lá, é criada na hora. Sair encerra as duas.
async function entrarNoAuth(email: string, senha: string): Promise<boolean> {
  try { await signInWithEmailAndPassword(getAuth(getApp()), email, senha); return true; } catch { return false; }
}
async function abrirSessaoAuth(email: string, senha: string) {
  const auth = getAuth(getApp());
  try { await signInWithEmailAndPassword(auth, email, senha); return; } catch { /* conta fora do Auth ou senha ainda não sincronizada */ }
  try { await createUserWithEmailAndPassword(auth, email, senha); } catch { /* o back-end acerta em seguida */ }
}
const sairDoAuth = () => { try { void signOut(getAuth(getApp())); } catch { /* sem Auth */ } };

export type Sessao = { id: string; nome: string; login: string; admin: boolean; permissoes: string[]; expira: number };

const DURACAO = 12 * 60 * 60 * 1000; // 12 h

export function lerSessao(): Sessao | null {
  try {
    const s = JSON.parse(localStorage.getItem(SITE_ADMIN.chaveSessao) || "null") as Sessao | null;
    return s && s.expira > Date.now() ? s : null;
  } catch {
    return null;
  }
}

function gravarSessao(s: Sessao | null) {
  try {
    if (s) localStorage.setItem(SITE_ADMIN.chaveSessao, JSON.stringify(s));
    else localStorage.removeItem(SITE_ADMIN.chaveSessao);
  } catch { /* navegador sem storage: a sessão dura só esta aba */ }
}

export const sair = () => { sairDoAuth(); gravarSessao(null); };
export const pode = (s: Sessao | null, permissao: string) => !!s && (s.admin || s.permissoes.includes(permissao));

const ehAdmin = (u: any) => String(u.nivel) === "99" || u.perfil === "administrador" || SITE_ADMIN.perfis[u.perfil] === "*";

async function permissoesDe(u: any): Promise<string[]> {
  const proprias: string[] = Array.isArray(u.permissions) ? u.permissions : [];
  const doPerfil = SITE_ADMIN.perfis[u.perfil];
  const perfil: string[] = Array.isArray(doPerfil) ? doPerfil : [];
  let doGrupo: string[] = [];
  if (u.id_grupo) {
    const g = await lerDoc("grupo", String(u.id_grupo)).catch(() => null);
    if (g && g.status !== "Inativo" && Array.isArray(g.permissions)) doGrupo = g.permissions;
  }
  return [...new Set([...proprias, ...perfil, ...doGrupo])];
}

async function montarSessao(u: any): Promise<Sessao> {
  return { id: String(u.id), nome: u.nome || u.login, login: u.login || u.email, admin: ehAdmin(u), permissoes: await permissoesDe(u), expira: Date.now() + DURACAO };
}

// Mesmas regras e mensagens do login dos painéis (@hc/components/acesso/loginPainel).
export async function entrar(identificador: string, senha: string): Promise<{ ok: true; sessao: Sessao } | { ok: false; erro: string }> {
  const id = normalizarEmail(identificador);
  if (!id || !senha) return { ok: false, erro: "Informe o e-mail (ou login) e a senha." };
  // AUTH PRIMEIRO (regras fechadas: `usuarios` só abre logado). Login sem "@" ainda funciona onde o banco está aberto.
  const entrouNoAuth = id.includes("@") ? await entrarNoAuth(id, senha) : false;
  let u = (await filtrar("usuarios", "email", id).catch(() => []))[0] ?? (id.includes("@") ? undefined : (await filtrar("usuarios", "login", id).catch(() => []))[0]);
  if (!u && id.includes("@") && !entrouNoAuth) return { ok: false, erro: "E-mail ou senha incorretos." };
  if (!u && SITE_ADMIN.colecaoUsuariosLegado) {
    const r = await entrarLegado(id, senha);
    if (r === "senha") return { ok: false, erro: "Senha incorreta." };
    if (r) u = r;
  }
  if (!u) return { ok: false, erro: "Usuário não encontrado. Verifique o e-mail ou login." };
  if (!u.senha_hash) return { ok: false, erro: "Este usuário ainda não tem senha. Peça ao administrador para definir a senha." };
  if (!entrouNoAuth && !(await conferirSenha(senha, u))) return { ok: false, erro: "Senha incorreta." };
  if (u.status === "bloqueado") return { ok: false, erro: "Usuário bloqueado. Entre em contato com o administrador." };
  if (u.status !== "ativo") return { ok: false, erro: "Usuário desativado. Entre em contato com o administrador." };
  const vencido = problemaValidade(u); // validade do usuário (perpétua ou por tempo)
  if (vencido) return { ok: false, erro: vencido };
  if (!entrouNoAuth && String(u.email ?? "").includes("@")) await abrirSessaoAuth(normalizarEmail(u.email), senha);
  const sessao = await montarSessao(u);
  gravarSessao(sessao);
  await alterar("usuarios", sessao.id, { ultimo_acesso_em: Date.now() }).catch(() => {});
  registrarAuditoria(sessao, { colecao: "usuarios", id_registro: sessao.id, acao: "login", descricao: "Entrada no /admin do site" });
  return { ok: true, sessao };
}

// Ao abrir o /admin: confere de novo o usuário (desativado/bloqueado sai na hora) e atualiza as permissões.
export async function revalidarSessao(s: Sessao): Promise<Sessao | null> {
  const u = await lerDoc("usuarios", s.id).catch(() => undefined);
  if (u === undefined) return s; // sem rede: mantém
  if (!u || u.status !== "ativo" || problemaValidade(u)) { sair(); return null; }
  const nova = { ...(await montarSessao(u)), expira: s.expira };
  gravarSessao(nova);
  return nova;
}

// Trilha de auditoria no formato dos painéis (coleção `logs_auditoria`). Nunca derruba a operação; senha/hash nunca vão.
const SENSIVEIS = ["senha", "senha_hash", "senha_salt", "senha_iteracoes"];
const semSensiveis = (d?: Record<string, any> | null) =>
  d ? Object.fromEntries(Object.entries(d).filter(([k, v]) => v !== undefined && k !== "id" && !SENSIVEIS.includes(k))) : null;

export async function registrarAuditoria(s: Sessao | null, p: {
  colecao: string; id_registro: string; acao: "criacao" | "alteracao" | "exclusao" | "login" | "outro"; descricao?: string;
  dados_anteriores?: Record<string, any> | null; dados_novos?: Record<string, any> | null;
}): Promise<void> {
  try {
    await criar("logs_auditoria", {
      id_usuarios: s?.id ?? null, usuario_nome: s?.nome ?? "Sistema", modulo: SITE_ADMIN.modulo, colecao: p.colecao,
      id_registro: String(p.id_registro), acao: p.acao, descricao: p.descricao ?? "",
      dados_anteriores: semSensiveis(p.dados_anteriores), dados_novos: semSensiveis(p.dados_novos), origem: "painel_web",
    });
  } catch (erro) {
    console.error("Erro ao gravar a auditoria", erro);
  }
}

// ── Usuários ANTIGOS (sites gerados antes do kit: coleção usuarios_admin, senha "pbkdf2$<iterações>$<sal hex>$<hash hex>",
// o sal usado como TEXTO) — conferidos aqui e COPIADOS para `usuarios` no formato do núcleo (vale também no admsite360).
async function conferirLegado(senha: string, guardado: string): Promise<boolean> {
  const [alg, it, sal, hash] = String(guardado || "").split("$");
  if (alg !== "pbkdf2" || !sal || !hash) return false;
  const chave = await crypto.subtle.importKey("raw", new TextEncoder().encode(senha), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(sal), iterations: Number(it) }, chave, 256);
  const calc = Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
  return calc.length === hash.length && calc === hash.toLowerCase();
}
async function entrarLegado(login: string, senha: string): Promise<any | "senha" | null> {
  const col = SITE_ADMIN.colecaoUsuariosLegado!;
  const v = (await filtrar(col, "login", login).catch(() => []))[0];
  if (!v || v.status === "inativo") return null;
  if (!(await conferirLegado(senha, v.senha_hash))) return "senha";
  const novo = {
    nome: v.nome || login, login, email: null, perfil: "administrador", nivel: "99", status: "ativo", permissions: [], id_grupo: null,
    ...(await gerarHashSenha(senha, crypto.getRandomValues(new Uint8Array(BYTES_SALT)))),
  };
  const idNovo = await criar("usuarios", novo);
  await alterar(col, String(v.id), { migrado_para: idNovo }).catch(() => {});
  return { id: idNovo, ...novo };
}

/** Troca a senha do próprio usuário (confere a atual). */
export async function trocarSenha(s: Sessao, atual: string, nova: string): Promise<string | null> {
  const u = await lerDoc("usuarios", s.id);
  if (!u || !(await conferirSenha(atual, u))) return "Senha atual incorreta.";
  const problema = problemaSenhaUsuario(nova);
  if (problema) return problema;
  await alterar("usuarios", s.id, await gerarHashSenha(nova, crypto.getRandomValues(new Uint8Array(BYTES_SALT))));
  registrarAuditoria(s, { colecao: "usuarios", id_registro: s.id, acao: "alteracao", descricao: "Senha trocada no /admin" });
  return null;
}
