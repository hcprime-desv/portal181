export interface Procurado {
  id: string;
  nome: string;
  apelido?: string;
  idade?: number;
  municipio?: string;
  motivo?: string;
  orgaoResponsavel?: string;
  fotoUrl?: string;
  ativo?: boolean;
}

export interface Desaparecido {
  id: string;
  nome: string;
  idade?: number;
  municipio?: string;
  dataDesaparecimento?: string;
  fotoUrl?: string;
  ativo?: boolean;
}

export interface Recompensa {
  id: string;
  titulo: string;
  descricao: string;
  valor: string;
  fotoUrl?: string;
  ativo?: boolean;
}

export interface Noticia {
  id: string;
  titulo: string;
  resumo?: string;
  data: string;
  imagemUrl?: string;
  ativo?: boolean;
}

// Resultados (prisões/apreensões decorrentes de denúncias) — /admin →
// Resultados. `id_natureza` aponta para dados/{tenant}/natureza.
export interface Resultado {
  id: string;
  titulo: string;
  descricao: string;
  data?: string;
  id_natureza?: string;
  municipio?: string;
  ativo?: boolean;
}

// CMS genérico de páginas institucionais (Sobre, Perguntas Frequentes
// etc.), cadastrado no /admin (dados/{tenant}/paginas). `conteudo` é
// Markdown (editor com pré-visualização no /admin) — renderizado
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
  // Só relevante quando local === "Menu" — páginas com o mesmo texto aqui
  // viram um único dropdown no cabeçalho (ver Header.tsx), em vez de links
  // soltos. Vazio/ausente = link direto no menu, comportamento de sempre.
  submenu?: string;
}

// Popup/banner do site, cadastrado no /admin (dados/{tenant}/avisos).
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

export type TemaSite = "claro" | "escuro" | "automatico";

// Doc único (dados/{tenant}/configuracoes/geral), editado em /admin →
// Configuração do site — nome do órgão, cores, contato
// e imagem de fundo da home, pra nunca ficar hardcoded assumindo
// "Bahia"/"SSP-BA" ou uma foto fixa no código deste site (ver CLAUDE.md).
// Cores (só hex válido; senão vale o padrão do globals.css): `corPrimaria`
// = fundo escuro (rodapé, menu do /admin) → --navy; `corSecundaria` =
// principal (botões, links) → --blue; `corDestaque` → --green. `tema` e
// `temaBotao` = tema claro/escuro, igual ao site padrão (p2pcorp).
// Visibilidade de cada seção do menu (Header.tsx) — undefined (nunca
// configurado) é tratado como "mostrar" em todo lugar que lê isso, pra
// não sumir menu nenhum de um site já no ar antes dessa config existir.
// `menuBaralhos`/`menuPaginas` são chaves-mestre: ligam/desligam a SEÇÃO
// inteira; quais baralhos (Baralho do Crime, Baralho Lilás...) ou páginas
// aparecem dentro dela continua vindo do campo "Ativo"/"Local" de cada
// item (Baralho.ativo, Pagina.local), não duplicado aqui.
export interface Configuracao {
  nomeOrgao?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  telefone?: string;
  email?: string;
  logoUrl?: string;
  textoRodape?: string;
  imagemFundoUrl?: string;
  corDestaque?: string;
  endereco?: string;
  tema?: TemaSite;
  temaBotao?: boolean;
  /** cor das letras no modo escuro (hex); padrão azul-claro #bcd8ff */
  corTextoEscuro?: string;
  menuInicio?: boolean;
  menuDenuncie?: boolean;
  menuProcurados?: boolean;
  menuDesaparecidos?: boolean;
  menuBaralhos?: boolean;
  menuPaginas?: boolean;
  menuRecompensas?: boolean;
  menuNoticias?: boolean;
  menuSobre?: boolean;
}
