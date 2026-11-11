// Cadastros do /admin — os mesmos campos das telas do antigo painel
// apps/portal181 (coleções em dados/{tenant}/...). Cada cadastro é DESCRITO
// aqui e desenhado pelo componente genérico components/admin/Cadastro.tsx.
// Cadastro novo = uma entrada em CADASTROS (+ item no menu, MENU_ADMIN).
import { BYTES_SALT, gerarHashSenha, normalizarEmail, problemaSenhaUsuario } from "@/lib/compartilhado/senhas";
import { getFilterOnce } from "@/lib/firebase/gen";
import { PERMANENCIAS, ROTULOS_PERMANENCIA, planejarValidade } from "@/lib/compartilhado/validade";
import { PERMISSOES, ROTULOS_PERMISSAO } from "./sessao";

export type Opcao = { valor: string; rotulo: string };

export type Campo = {
  nome: string;
  rotulo: string;
  tipo: "texto" | "textarea" | "markdown" | "numero" | "data" | "select" | "check" | "imagem" | "cor" | "lista" | "senha" | "email" | "permissoes";
  obrigatorio?: boolean;
  dica?: string;
  placeholder?: string;
  largura?: 1 | 2 | 3; // colunas da grade (3 = linha inteira)
  opcoes?: Opcao[];
  // Opções lidas de outra coleção (ex.: natureza, baralhos, procurados).
  fonte?: { colecao: string; rotulo: string; filtro?: (d: any) => boolean };
  padrao?: any;
};

export type Coluna = { campo: string; rotulo: string; tipo?: "check" | "imagem" | "selo" | "ref" | "lista" | "validade" };

export type Cadastro = {
  id: string; // rota: /admin/<id>
  titulo: string;
  singular: string;
  colecao: string;
  permissao: string;
  descricao?: string;
  campos: Campo[];
  colunas: Coluna[];
  rotulo: string; // campo que identifica o registro (exclusão, auditoria)
  ordenar?: (a: any, b: any) => number;
  // Ajuste final antes de gravar (ou mensagem de erro).
  preparar?: (dados: Record<string, any>, original: Record<string, any> | null) => Promise<Record<string, any> | string>;
};

const ATIVO: Campo = { nome: "ativo", rotulo: "Ativo (visível no site)", tipo: "check", padrao: true };
const COL_ATIVO: Coluna = { campo: "ativo", rotulo: "No site", tipo: "check" };
const porNome = (a: any, b: any) => String(a.nome || "").localeCompare(String(b.nome || ""));
const chaveData = (d: string) => String(d || "").split("/").reverse().join("");
const porData = (a: any, b: any) => chaveData(b.data).localeCompare(chaveData(a.data));
const porOrdem = (a: any, b: any) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const VALORES_CARTA = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const PERFIS: Opcao[] = [
  { valor: "administrador", rotulo: "Administrador (tudo)" },
  { valor: "editor", rotulo: "Editor de conteúdo" },
  { valor: "auditoria", rotulo: "Auditoria (só consulta)" },
];

export const CADASTROS: Cadastro[] = [
  {
    id: "noticias", titulo: "Notícias", singular: "notícia", colecao: "noticias", permissao: PERMISSOES.noticias, rotulo: "titulo", ordenar: porData,
    descricao: "Notícias e resultados mostrados na Home e em /noticias.",
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "data", rotulo: "Data", tipo: "data", obrigatorio: true, dica: "Ordena as notícias no site (mais nova primeiro)." },
      { nome: "resumo", rotulo: "Resumo", tipo: "textarea", largura: 3 },
      { nome: "imagemUrl", rotulo: "Imagem", tipo: "imagem", largura: 2 },
      ATIVO,
    ],
    colunas: [{ campo: "imagemUrl", rotulo: "", tipo: "imagem" }, { campo: "titulo", rotulo: "Título" }, { campo: "data", rotulo: "Data" }, COL_ATIVO],
  },
  {
    id: "procurados", titulo: "Procurados", singular: "procurado", colecao: "procurados", permissao: PERMISSOES.procurados, rotulo: "nome", ordenar: porNome,
    campos: [
      { nome: "nome", rotulo: "Nome", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "apelido", rotulo: "Apelido", tipo: "texto" },
      { nome: "idade", rotulo: "Idade", tipo: "numero" },
      { nome: "municipio", rotulo: "Município", tipo: "texto" },
      { nome: "orgaoResponsavel", rotulo: "Órgão responsável", tipo: "texto" },
      { nome: "motivo", rotulo: "Motivo", tipo: "textarea", largura: 3 },
      { nome: "fotoUrl", rotulo: "Foto", tipo: "imagem", largura: 2 },
      ATIVO,
    ],
    colunas: [{ campo: "fotoUrl", rotulo: "", tipo: "imagem" }, { campo: "nome", rotulo: "Nome" }, { campo: "municipio", rotulo: "Município" }, { campo: "motivo", rotulo: "Motivo" }, COL_ATIVO],
  },
  {
    id: "desaparecidos", titulo: "Desaparecidos", singular: "desaparecido", colecao: "desaparecidos", permissao: PERMISSOES.desaparecidos, rotulo: "nome", ordenar: porNome,
    campos: [
      { nome: "nome", rotulo: "Nome", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "idade", rotulo: "Idade", tipo: "numero" },
      { nome: "municipio", rotulo: "Município", tipo: "texto" },
      { nome: "dataDesaparecimento", rotulo: "Data do desaparecimento", tipo: "data" },
      { nome: "fotoUrl", rotulo: "Foto", tipo: "imagem" },
      ATIVO,
    ],
    colunas: [{ campo: "fotoUrl", rotulo: "", tipo: "imagem" }, { campo: "nome", rotulo: "Nome" }, { campo: "dataDesaparecimento", rotulo: "Desaparecimento" }, { campo: "municipio", rotulo: "Município" }, COL_ATIVO],
  },
  {
    id: "recompensas", titulo: "Recompensas", singular: "recompensa", colecao: "recompensas", permissao: PERMISSOES.recompensas, rotulo: "titulo",
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "valor", rotulo: "Valor", tipo: "texto", obrigatorio: true, placeholder: "Até R$ 50.000,00" },
      { nome: "descricao", rotulo: "Descrição", tipo: "textarea", obrigatorio: true, largura: 3 },
      { nome: "fotoUrl", rotulo: "Foto", tipo: "imagem", largura: 2 },
      ATIVO,
    ],
    colunas: [{ campo: "fotoUrl", rotulo: "", tipo: "imagem" }, { campo: "titulo", rotulo: "Título" }, { campo: "valor", rotulo: "Valor" }, COL_ATIVO],
  },
  {
    id: "resultados", titulo: "Resultados", singular: "resultado", colecao: "resultados", permissao: PERMISSOES.resultados, rotulo: "titulo", ordenar: porData,
    descricao: "Prisões e apreensões decorrentes de denúncias (aparecem nos Relatórios).",
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "id_natureza", rotulo: "Natureza", tipo: "select", fonte: { colecao: "natureza", rotulo: "nome" } },
      { nome: "data", rotulo: "Data", tipo: "data" },
      { nome: "municipio", rotulo: "Município", tipo: "texto" },
      { nome: "descricao", rotulo: "Descrição", tipo: "textarea", obrigatorio: true, largura: 3 },
      ATIVO,
    ],
    colunas: [{ campo: "titulo", rotulo: "Título" }, { campo: "id_natureza", rotulo: "Natureza", tipo: "ref" }, { campo: "municipio", rotulo: "Município" }, { campo: "data", rotulo: "Data" }, COL_ATIVO],
  },
  {
    id: "avisos", titulo: "Avisos", singular: "aviso", colecao: "avisos", permissao: PERMISSOES.avisos, rotulo: "titulo", ordenar: porOrdem,
    descricao: "Pop-up de entrada (urgente) ou banner flutuante no site.",
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "ordem", rotulo: "Ordem", tipo: "numero", dica: "Com mais de um aviso ativo, o menor número aparece primeiro." },
      { nome: "mensagem", rotulo: "Mensagem", tipo: "markdown", obrigatorio: true, largura: 3 },
      { nome: "imagemUrl", rotulo: "Imagem", tipo: "imagem" },
      { nome: "linkUrl", rotulo: "Link (opcional)", tipo: "texto", placeholder: "https://... ou /noticias" },
      { nome: "linkTexto", rotulo: "Texto do botão", tipo: "texto", placeholder: "Saiba mais" },
      { nome: "urgente", rotulo: "Urgente (pop-up ao entrar no site)", tipo: "check", dica: "Marcado: modal que bloqueia a tela até fechar — só para alertas críticos. Desmarcado: banner flutuante." },
      ATIVO,
    ],
    colunas: [{ campo: "titulo", rotulo: "Título" }, { campo: "urgente", rotulo: "Formato", tipo: "selo" }, { campo: "ordem", rotulo: "Ordem" }, COL_ATIVO],
  },
  {
    id: "baralhos", titulo: "Baralhos", singular: "baralho", colecao: "baralhos", permissao: PERMISSOES.baralhos, rotulo: "nome", ordenar: porOrdem,
    descricao: "Baralho do Crime, Baralho Lilás... cada um vira /baralho/<slug> e entra no menu.",
    campos: [
      { nome: "nome", rotulo: "Nome", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "ordem", rotulo: "Ordem", tipo: "numero" },
      { nome: "slug", rotulo: "Slug (endereço)", tipo: "texto", obrigatorio: true, placeholder: "baralho-do-crime", dica: "Só letras minúsculas, números e hífen." },
      { nome: "naipes", rotulo: "Naipes", tipo: "lista", obrigatorio: true, largura: 2, placeholder: "ouros, espadas, paus, copas", dica: "Separados por vírgula." },
      ATIVO,
    ],
    colunas: [{ campo: "nome", rotulo: "Nome" }, { campo: "slug", rotulo: "Slug" }, { campo: "naipes", rotulo: "Naipes", tipo: "lista" }, { campo: "ordem", rotulo: "Ordem" }, COL_ATIVO],
    preparar: async (d) => (SLUG.test(d.slug || "") ? d : "Slug: use só letras minúsculas, números e hífen (ex.: baralho-do-crime)."),
  },
  {
    id: "cartas", titulo: "Cartas do baralho", singular: "carta", colecao: "baralhoCartas", permissao: PERMISSOES.cartas, rotulo: "nome",
    campos: [
      { nome: "baralhoId", rotulo: "Baralho", tipo: "select", obrigatorio: true, fonte: { colecao: "baralhos", rotulo: "nome" } },
      { nome: "naipe", rotulo: "Naipe", tipo: "texto", obrigatorio: true, placeholder: "ouros, espadas, paus, copas..." },
      { nome: "valor", rotulo: "Valor", tipo: "select", obrigatorio: true, opcoes: VALORES_CARTA.map((v) => ({ valor: v, rotulo: v })) },
      { nome: "procuradoId", rotulo: "Procurado vinculado", tipo: "select", largura: 2, fonte: { colecao: "procurados", rotulo: "nome" } },
      { nome: "nome", rotulo: "Nome (se não vinculado)", tipo: "texto" },
      { nome: "descricao", rotulo: "Descrição", tipo: "textarea", largura: 3 },
      { nome: "fotoUrl", rotulo: "Foto", tipo: "imagem", largura: 2 },
    ],
    colunas: [{ campo: "fotoUrl", rotulo: "", tipo: "imagem" }, { campo: "baralhoId", rotulo: "Baralho", tipo: "ref" }, { campo: "naipe", rotulo: "Naipe" }, { campo: "valor", rotulo: "Valor" }, { campo: "nome", rotulo: "Nome" }],
  },
  {
    id: "paginas", titulo: "Páginas", singular: "página", colecao: "paginas", permissao: PERMISSOES.paginas, rotulo: "titulo",
    descricao: "Páginas institucionais (/paginas/<slug>), no menu ou no rodapé.",
    campos: [
      { nome: "titulo", rotulo: "Título", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "status", rotulo: "Status", tipo: "select", obrigatorio: true, padrao: "Rascunho", opcoes: [{ valor: "Rascunho", rotulo: "Rascunho" }, { valor: "Publicado", rotulo: "Publicado" }] },
      { nome: "slug", rotulo: "Slug (endereço)", tipo: "texto", obrigatorio: true, placeholder: "perguntas-frequentes", dica: "Só letras minúsculas, números e hífen." },
      { nome: "local", rotulo: "Exibir em", tipo: "select", padrao: "Rodapé", opcoes: [{ valor: "Rodapé", rotulo: "Rodapé" }, { valor: "Menu", rotulo: "Menu" }] },
      { nome: "submenu", rotulo: "Submenu (opcional)", tipo: "texto", placeholder: "Material Divulgação", dica: "Só no Menu: páginas com o mesmo texto viram um grupo." },
      { nome: "conteudo", rotulo: "Conteúdo", tipo: "markdown", obrigatorio: true, largura: 3 },
      { nome: "imagemUrl", rotulo: "Imagem (banner, opcional)", tipo: "imagem" },
      { nome: "linkUrl", rotulo: "Link (opcional)", tipo: "texto", placeholder: "https://... ou /noticias" },
      { nome: "linkTexto", rotulo: "Texto do botão", tipo: "texto", placeholder: "Saiba mais" },
    ],
    colunas: [{ campo: "titulo", rotulo: "Título" }, { campo: "slug", rotulo: "Slug" }, { campo: "status", rotulo: "Status", tipo: "selo" }, { campo: "local", rotulo: "Exibição" }, { campo: "submenu", rotulo: "Submenu" }],
    preparar: async (d) => (SLUG.test(d.slug || "") ? d : "Slug: use só letras minúsculas, números e hífen (ex.: perguntas-frequentes)."),
  },
  {
    id: "usuarios", titulo: "Usuários", singular: "usuário", colecao: "usuarios", permissao: PERMISSOES.usuarios, rotulo: "nome", ordenar: porNome,
    descricao: "Quem entra no /admin. Os mesmos usuários do cliente no core360.",
    campos: [
      { nome: "nome", rotulo: "Nome", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "login", rotulo: "Login", tipo: "texto", obrigatorio: true },
      { nome: "email", rotulo: "E-mail", tipo: "email", largura: 2 },
      { nome: "perfil", rotulo: "Perfil", tipo: "select", obrigatorio: true, padrao: "editor", opcoes: PERFIS },
      { nome: "id_grupo", rotulo: "Grupo de permissões", tipo: "select", fonte: { colecao: "grupo", rotulo: "nome" }, dica: "Administrador vê tudo; os outros perfis veem o que o grupo libera." },
      { nome: "status", rotulo: "Situação", tipo: "select", obrigatorio: true, padrao: "ativo", opcoes: [{ valor: "ativo", rotulo: "Ativo" }, { valor: "inativo", rotulo: "Inativo" }, { valor: "bloqueado", rotulo: "Bloqueado" }] },
      { nome: "senha", rotulo: "Senha", tipo: "senha", dica: "Na edição, em branco mantém a senha atual." },
      // Validade do usuário (dono, 11/11/2026 — global): perpétua ou por tempo; conta a partir de quando salvar.
      { nome: "permanencia", rotulo: "Tempo de permanência", tipo: "select", padrao: "perpetua", opcoes: PERMANENCIAS.map((v) => ({ valor: v, rotulo: ROTULOS_PERMANENCIA[v] })), dica: "Acesso de teste: o usuário expira ao fim do prazo. Salvar um usuário vencido renova a partir de agora." },
      { nome: "permanencia_qtd", rotulo: "Quantidade", tipo: "numero" },
    ],
    colunas: [{ campo: "nome", rotulo: "Nome" }, { campo: "login", rotulo: "Login" }, { campo: "perfil", rotulo: "Perfil" }, { campo: "id_grupo", rotulo: "Grupo", tipo: "ref" }, { campo: "expira_em", rotulo: "Validade", tipo: "validade" }, { campo: "status", rotulo: "Situação", tipo: "selo" }],
    preparar: async (d, original) => {
      const login = normalizarEmail(d.login);
      const email = normalizarEmail(d.email || "");
      const outros = (await getFilterOnce("usuarios", "login", login)).filter((u) => String(u.id) !== String(original?.id));
      if (outros.length) return `Já existe um usuário com o login "${login}".`;
      const { senha, ...resto } = d;
      let validade: ReturnType<typeof planejarValidade>;
      try { validade = planejarValidade(original, { permanencia: d.permanencia, permanencia_qtd: d.permanencia_qtd }); } catch (e: any) { return e?.message || "Informe o tempo de permanência."; }
      const saida: Record<string, any> = { ...resto, ...validade, login, email, nivel: d.perfil === "administrador" ? "99" : "1" };
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
    id: "grupos", titulo: "Grupos de permissões", singular: "grupo", colecao: "grupo", permissao: PERMISSOES.grupos, rotulo: "nome", ordenar: porNome,
    descricao: "O que cada grupo pode abrir no /admin.",
    campos: [
      { nome: "nome", rotulo: "Nome", tipo: "texto", obrigatorio: true, largura: 2 },
      { nome: "status", rotulo: "Situação", tipo: "select", padrao: "Ativo", opcoes: [{ valor: "Ativo", rotulo: "Ativo" }, { valor: "Inativo", rotulo: "Inativo" }] },
      { nome: "permissions", rotulo: "Pode abrir", tipo: "permissoes", largura: 3, opcoes: Object.entries(ROTULOS_PERMISSAO).map(([valor, rotulo]) => ({ valor, rotulo })) },
    ],
    colunas: [{ campo: "nome", rotulo: "Nome" }, { campo: "permissions", rotulo: "Permissões", tipo: "lista" }, { campo: "status", rotulo: "Situação", tipo: "selo" }],
  },
];

export const cadastroPorId = (id: string) => CADASTROS.find((c) => c.id === id);

// Configuração do site (doc único configuracoes/geral).
export const CAMPOS_CONFIGURACAO: Campo[] = [
  { nome: "nomeOrgao", rotulo: "Nome do órgão", tipo: "texto", largura: 2, placeholder: "Disque Denúncia — Secretaria de Segurança" },
  { nome: "telefone", rotulo: "Telefone", tipo: "texto" },
  { nome: "email", rotulo: "E-mail", tipo: "email" },
  { nome: "endereco", rotulo: "Endereço", tipo: "texto", largura: 2 },
  { nome: "textoRodape", rotulo: "Texto do rodapé", tipo: "textarea", largura: 3 },
  { nome: "logoUrl", rotulo: "Logo", tipo: "imagem", dica: "Sem logo, vale o do Portal 181." },
  { nome: "imagemFundoUrl", rotulo: "Imagem de fundo (topo da Home)", tipo: "imagem", largura: 2, dica: "Sem imagem, vale o banner padrão." },
  { nome: "corSecundaria", rotulo: "Cor principal (botões e links)", tipo: "cor", placeholder: "#075fd7" },
  { nome: "corDestaque", rotulo: "Cor de destaque", tipo: "cor", placeholder: "#07a958" },
  { nome: "corPrimaria", rotulo: "Cor escura (rodapé e menu do admin)", tipo: "cor", placeholder: "#0b1f45" },
  { nome: "tema", rotulo: "Tema do site", tipo: "select", padrao: "escuro", opcoes: [{ valor: "escuro", rotulo: "Escuro (padrão)" }, { valor: "claro", rotulo: "Claro" }, { valor: "automatico", rotulo: "Automático (segue o aparelho)" }] },
  { nome: "temaBotao", rotulo: "Mostrar botão claro/escuro no topo", tipo: "check", padrao: true },
  { nome: "corTextoEscuro", rotulo: "Cor das letras no modo escuro", tipo: "cor", placeholder: "#bcd8ff", dica: "Padrão: azul-claro (#bcd8ff). Títulos ficam um tom mais claro da mesma cor." },
];

export const MENU_SITE: Campo[] = [
  { nome: "menuInicio", rotulo: "Início", tipo: "check", padrao: true },
  { nome: "menuDenuncie", rotulo: "Fazer denúncia (botão e página)", tipo: "check", padrao: true },
  { nome: "menuProcurados", rotulo: "Procurados", tipo: "check", padrao: true },
  { nome: "menuDesaparecidos", rotulo: "Desaparecidos", tipo: "check", padrao: true },
  { nome: "menuBaralhos", rotulo: "Baralhos", tipo: "check", padrao: true, dica: "Quais baralhos: campo Ativo de cada um." },
  { nome: "menuPaginas", rotulo: "Páginas no menu", tipo: "check", padrao: true, dica: "Quais páginas: campo Exibir em de cada uma." },
  { nome: "menuRecompensas", rotulo: "Recompensas", tipo: "check", padrao: true },
  { nome: "menuNoticias", rotulo: "Notícias", tipo: "check", padrao: true },
  { nome: "menuSobre", rotulo: "Sobre (como funciona)", tipo: "check", padrao: true },
];
