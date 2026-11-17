// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/layout/src/sites/admin e copie de novo.
// /admin dos SITES — cadastros COMUNS a todo site: Usuários (senha PBKDF2, igual aos painéis) e Grupos de permissões.
// O site junta estes aos dele em lib/admin/site.tsx: `cadastros: [...CADASTROS_DO_SITE, ...cadastrosNucleo(PERMISSOES, PERFIS)]`.
import { BYTES_SALT, gerarHashSenha, normalizarEmail, problemaSenhaUsuario } from "./senhas";
import { filtrar } from "./banco";
import { PERMANENCIAS, ROTULOS_PERMANENCIA, planejarValidade } from "./validade";
import type { Cadastro, Opcao } from "./tipos";

export const PERMISSAO_USUARIOS = "menu.configuracoes.login";
export const PERMISSAO_GRUPOS = "menu.grupo";
export const PERMISSAO_PAINEL = "menu.site.painel";

const porNome = (a: any, b: any) => String(a.nome || "").localeCompare(String(b.nome || ""));

/** `permissoes` = chave → rótulo (o que um grupo pode liberar); `perfis` = perfis do usuário (valor → rótulo). */
export function cadastrosNucleo(permissoes: Record<string, string>, perfis: Opcao[]): Cadastro[] {
  return [
    {
      id: "usuarios", titulo: "Usuários", singular: "usuário", colecao: "usuarios", permissao: PERMISSAO_USUARIOS, rotulo: "nome", ordenar: porNome,
      descricao: "Quem entra no /admin — os mesmos usuários do painel que gerencia o site.",
      campos: [
        { nome: "nome", rotulo: "Nome", tipo: "texto", obrigatorio: true, largura: 2 },
        { nome: "login", rotulo: "Login", tipo: "texto", obrigatorio: true },
        { nome: "email", rotulo: "E-mail", tipo: "email", largura: 2 },
        { nome: "perfil", rotulo: "Perfil", tipo: "select", obrigatorio: true, padrao: perfis[0]?.valor ?? "editor", opcoes: perfis },
        { nome: "id_grupo", rotulo: "Grupo de permissões", tipo: "select", fonte: { colecao: "grupo", rotulo: "nome" }, dica: "Somado ao que o perfil já libera. Administrador vê tudo." },
        { nome: "status", rotulo: "Situação", tipo: "select", obrigatorio: true, padrao: "ativo", opcoes: [{ valor: "ativo", rotulo: "Ativo" }, { valor: "inativo", rotulo: "Inativo" }, { valor: "bloqueado", rotulo: "Bloqueado" }] },
        { nome: "senha", rotulo: "Senha", tipo: "senha", dica: "Na edição, em branco mantém a senha atual." },
        // Validade do usuário (dono, 11/11/2026 — global): perpétua ou por tempo; conta a partir de quando salvar.
        { nome: "permanencia", rotulo: "Tempo de permanência", tipo: "select", padrao: "perpetua", opcoes: PERMANENCIAS.map((v) => ({ valor: v, rotulo: ROTULOS_PERMANENCIA[v] })), dica: "Acesso de teste: o usuário expira ao fim do prazo. Salvar um usuário vencido renova a partir de agora." },
        { nome: "permanencia_qtd", rotulo: "Quantidade", tipo: "numero", placeholder: "ex.: 7" },
      ],
      colunas: [{ campo: "nome", rotulo: "Nome" }, { campo: "login", rotulo: "Login" }, { campo: "perfil", rotulo: "Perfil", tipo: "opcao" }, { campo: "id_grupo", rotulo: "Grupo", tipo: "ref" }, { campo: "expira_em", rotulo: "Expira em", tipo: "datahora" }, { campo: "status", rotulo: "Situação", tipo: "selo" }],
      preparar: async (d, original) => {
        const login = normalizarEmail(d.login);
        const email = normalizarEmail(d.email || "");
        const outros = (await filtrar("usuarios", "login", login)).filter((u) => String(u.id) !== String(original?.id));
        if (outros.length) return `Já existe um usuário com o login "${login}".`;
        const { senha, ...resto } = d;
        let validade: ReturnType<typeof planejarValidade>;
        try { validade = planejarValidade(original, { permanencia: d.permanencia, permanencia_qtd: d.permanencia_qtd }); } catch (e: any) { return e?.message || "Informe o tempo de permanência."; }
        const saida: Record<string, any> = { ...resto, ...validade, login, email: email || null, nivel: d.perfil === "administrador" ? "99" : "1" };
        if (senha) {
          const problema = problemaSenhaUsuario(senha);
          if (problema) return problema;
          Object.assign(saida, await gerarHashSenha(senha, crypto.getRandomValues(new Uint8Array(BYTES_SALT))));
        } else if (!original?.senha_hash) {
          return "Defina a senha do novo usuário.";
        }
        return saida;
      },
    },
    {
      id: "grupos", titulo: "Grupos de permissões", singular: "grupo", colecao: "grupo", permissao: PERMISSAO_GRUPOS, rotulo: "nome", ordenar: porNome,
      descricao: "O que cada grupo pode abrir no /admin (somado ao perfil do usuário).",
      campos: [
        { nome: "nome", rotulo: "Nome", tipo: "texto", obrigatorio: true, largura: 2 },
        { nome: "status", rotulo: "Situação", tipo: "select", padrao: "Ativo", opcoes: [{ valor: "Ativo", rotulo: "Ativo" }, { valor: "Inativo", rotulo: "Inativo" }] },
        { nome: "permissions", rotulo: "Pode abrir", tipo: "permissoes", largura: 3, opcoes: Object.entries(permissoes).map(([valor, rotulo]) => ({ valor, rotulo })) },
      ],
      colunas: [{ campo: "nome", rotulo: "Nome" }, { campo: "permissions", rotulo: "Permissões", tipo: "lista" }, { campo: "status", rotulo: "Situação", tipo: "selo" }],
    },
  ];
}
