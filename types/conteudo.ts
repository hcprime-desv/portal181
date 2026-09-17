export interface Procurado {
  id: string;
  nome: string;
  apelido?: string;
  idade?: number;
  municipio?: string;
  motivo?: string;
  orgaoResponsavel?: string;
  fotoUrl?: string;
}

export interface Desaparecido {
  id: string;
  nome: string;
  idade?: number;
  municipio?: string;
  dataDesaparecimento?: string;
  fotoUrl?: string;
}

export interface Recompensa {
  id: string;
  titulo: string;
  descricao: string;
  valor: string;
  fotoUrl?: string;
}

export interface Noticia {
  id: string;
  titulo: string;
  resumo?: string;
  data: string;
  imagemUrl?: string;
}

// CMS genérico de páginas institucionais (Sobre, Perguntas Frequentes
// etc.), cadastrado no hcCore (dados/{tenant}/paginas). `conteudo` é
// Markdown (textarea simples no admin, sem editor visual) — renderizado
// de verdade no site via react-markdown (ver PaginaConteudo.tsx); HTML
// embutido no texto não é interpretado (sai como texto literal). `local`
// decide onde o link aparece no site: "Rodapé" (padrão) ou "Menu" (junto com
// Início/Denuncie/Procurados...) — páginas cadastradas antes desse campo
// existir vêm sem `local`, tratado como "Rodapé" (ver Header/Footer).
export interface Pagina {
  id: string;
  titulo: string;
  slug: string;
  conteudo: string;
  status: "Publicado" | "Rascunho";
  local?: "Rodapé" | "Menu";
  imagemUrl?: string;
  linkUrl?: string;
  linkTexto?: string;
}

// Popup/banner do site, cadastrado no hcCore (dados/{tenant}/avisos).
// `urgente` decide o formato: true → modal de entrada (bloqueia a tela até
// fechar, reservado pra alertas críticos); false/ausente → banner
// flutuante, não bloqueia nada (ver components/public/AvisosClient.tsx).
// `mensagem` é Markdown, mesma engine de Pagina.conteudo.
export interface Aviso {
  id: string;
  titulo: string;
  mensagem: string;
  imagemUrl?: string;
  linkUrl?: string;
  linkTexto?: string;
  urgente?: boolean;
  ativo?: boolean;
  ordem?: number;
}

// Doc único (dados/{tenant}/configuracoes/geral), cadastrado no hcCore
// (Configuracoes.tsx do módulo Portal181) — nome do órgão, cores, contato
// e imagem de fundo da home, pra nunca ficar hardcoded assumindo
// "Bahia"/"SSP-BA" ou uma foto fixa no código deste site (ver CLAUDE.md).
// `corPrimaria`/`corSecundaria` viram as CSS vars --navy/--blue (ver
// (public)/layout.tsx) só quando forem um hex válido — caso contrário o
// site mantém as cores padrão definidas em globals.css.
export interface Configuracao {
  nomeOrgao?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  telefone?: string;
  email?: string;
  logoUrl?: string;
  textoRodape?: string;
  imagemFundoUrl?: string;
}
