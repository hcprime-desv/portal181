import {
  listarNoticias,
  listarProcurados,
  listarDesaparecidos,
  listarRecompensas,
  listarPaginasPublicadas,
} from "./data";
import type { Noticia, Procurado, Desaparecido, Recompensa, Pagina } from "@/types/conteudo";

// Busca simples do site: sem motor de busca externo (Algolia/Elastic) nem
// índice próprio — filtra em memória sobre as mesmas coleções que as
// páginas de listagem já carregam (listarX de lib/data.ts), casando por
// substring sem acento/maiúscula. Serve bem pro volume de conteúdo de um
// portal institucional (dezenas/poucas centenas de itens por coleção); se
// o volume crescer muito, aí sim vale um índice de busca de verdade.
export interface ResultadoBusca {
  noticias: Noticia[];
  procurados: Procurado[];
  desaparecidos: Desaparecido[];
  recompensas: Recompensa[];
  paginas: Pagina[];
}

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function combina(query: string, ...campos: (string | undefined)[]): boolean {
  return campos.some((c) => c && normalizar(c).includes(query));
}

export async function buscarConteudo(queryOriginal: string): Promise<ResultadoBusca> {
  const query = normalizar(queryOriginal.trim());
  if (!query) {
    return { noticias: [], procurados: [], desaparecidos: [], recompensas: [], paginas: [] };
  }

  const [noticias, procurados, desaparecidos, recompensas, paginas] = await Promise.all([
    listarNoticias(),
    listarProcurados(),
    listarDesaparecidos(),
    listarRecompensas(),
    listarPaginasPublicadas(),
  ]);

  return {
    noticias: noticias.filter((n) => combina(query, n.titulo, n.resumo)),
    procurados: procurados.filter((p) => combina(query, p.nome, p.apelido, p.motivo, p.municipio)),
    desaparecidos: desaparecidos.filter((d) => combina(query, d.nome, d.municipio)),
    recompensas: recompensas.filter((r) => combina(query, r.titulo, r.descricao)),
    paginas: paginas.filter((p) => combina(query, p.titulo, p.conteudo)),
  };
}

// Só pra exibir um trecho legível do Markdown de Pagina.conteudo no
// resultado da busca — não é um parser de verdade, só limpa a sintaxe mais
// comum antes de truncar (o texto renderizado de verdade continua sendo
// via react-markdown em PaginaConteudo.tsx).
export function resumoTextoPlano(md: string, max = 160): string {
  const textoPlano = md
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~-]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return textoPlano.length > max ? `${textoPlano.slice(0, max)}…` : textoPlano;
}
