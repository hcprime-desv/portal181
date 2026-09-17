// Leitura pública de conteúdo (Procurados/Desaparecidos/Recompensas/
// Notícias/Baralhos/Páginas/Naturezas) — client-side, via
// lib/firebase/gen.ts (export estático, sem servidor, ver next.config.js).
//
// Duas famílias de função:
// - `listarX`/`buscarXPorSlug` — leitura pontual (getDocs), usada só onde
//   PRECISA ser assim: generateStaticParams/generateMetadata (rodam em
//   Node, no build, não dá pra "escutar" nada ali).
// - `subscribeX` — listener de verdade (onSnapshot, mesmo `getAll` que o
//   chat já usa) para os componentes "use client" das páginas públicas.
//   Sem isso, uma edição feita no painel (hcCore) só aparecia numa aba já
//   aberta depois de um F5 — o listener resolve isso.
//
// Tudo fica em dados/{tenant}/<colecao> (ver lib/firebase/gen.ts) — mesmo
// banco e mesmo padrão multi-tenant do hcCore.
//
// Antes do Firebase estar configurado (sem .env.local ainda) ou se a
// leitura falhar por qualquer motivo, cada função cai num fallback com
// conteúdo ilustrativo, pra tela não ficar em branco durante o
// desenvolvimento do esqueleto.
import { getAllOnce, getAll, getDocOnce } from "@/lib/firebase/gen";
import type { Unsubscribe } from "firebase/firestore";
import type { Procurado, Desaparecido, Recompensa, Noticia, Pagina, Aviso, Configuracao } from "@/types/conteudo";
import type { Baralho, CartaBaralho } from "@/types/baralho";
import { NATUREZAS } from "@/types/wizard";

async function tentarFirestore<T>(fn: () => Promise<T[]>, fallback: T[]): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

// `getAll` (onSnapshot) lança na hora se o tenant não estiver configurado
// (ver tenantColRef em lib/firebase/gen.ts) — igual ao `tentarFirestore`
// pontual, cai no fallback (uma vez só, sem updates) em vez de quebrar a
// tela.
function subscrever<T>(
  colecao: string,
  mapear: (docs: any[]) => T[],
  fallback: T[],
  callback: (dados: T[]) => void,
): Unsubscribe {
  try {
    return getAll(colecao, (docs) => callback(mapear(docs)));
  } catch {
    callback(fallback);
    return () => {};
  }
}

const PROCURADOS_MOCK: Procurado[] = [
  { id: "1", nome: "Carlos Silva", motivo: "Homicídio", municipio: "Salvador" },
  { id: "2", nome: "Marcos Oliveira", motivo: "Tráfico de drogas", municipio: "Feira de Santana" },
  { id: "3", nome: "João Pereira", motivo: "Roubo", municipio: "Salvador" },
];

const DESAPARECIDOS_MOCK: Desaparecido[] = [
  { id: "1", nome: "Ana Clara Souza", idade: 16, dataDesaparecimento: "10/04/2026" },
  { id: "2", nome: "Lucas Martins", idade: 12, dataDesaparecimento: "08/04/2026" },
  { id: "3", nome: "Mariana Silva", idade: 28, dataDesaparecimento: "05/04/2026" },
];

const RECOMPENSAS_MOCK: Recompensa[] = [
  { id: "1", titulo: "Foragido por homicídio", descricao: "Informações que levem à captura.", valor: "Até R$ 50.000,00" },
  { id: "2", titulo: "Líder de organização criminosa", descricao: "Informações que auxiliem a localização.", valor: "Até R$ 30.000,00" },
  { id: "3", titulo: "Armas e drogas", descricao: "Informações que levem à apreensão.", valor: "Até R$ 10.000,00" },
];

const NOTICIAS_MOCK: Noticia[] = [
  { id: "1", titulo: "Operação resulta em prisões após denúncias ao 181", data: "12/04/2026" },
  { id: "2", titulo: "Veículo roubado é recuperado com ajuda da população", data: "10/04/2026" },
  { id: "3", titulo: "Foragido da Justiça é preso após informação anônima", data: "08/04/2026" },
  { id: "4", titulo: "Denúncia leva à apreensão de drogas no interior", data: "05/04/2026" },
];

// Ilustrativo — em produção cada tenant configura seus próprios baralhos
// (nome, naipes, se existe ou não) via admin. Isso aqui só mantém a tela
// navegável antes do Firebase estar configurado.
const BARALHOS_MOCK: Baralho[] = [
  { id: "crime", slug: "baralho-do-crime", nome: "Baralho do Crime", naipes: ["ouros", "espadas", "paus", "copas"], ativo: true, ordem: 1 },
  { id: "lilas", slug: "baralho-lilas", nome: "Baralho Lilás", naipes: ["ouros", "espadas", "paus", "copas"], ativo: true, ordem: 2 },
];

export async function listarProcurados(): Promise<Procurado[]> {
  const docs = await tentarFirestore(() => getAllOnce("procurados"), PROCURADOS_MOCK as any[]);
  return [...docs].sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
}

export function subscribeProcurados(callback: (dados: Procurado[]) => void): Unsubscribe {
  return subscrever(
    "procurados",
    (docs) => [...docs].sort((a, b) => String(a.nome).localeCompare(String(b.nome))),
    PROCURADOS_MOCK,
    callback,
  );
}

export async function listarDesaparecidos(): Promise<Desaparecido[]> {
  const docs = await tentarFirestore(() => getAllOnce("desaparecidos"), DESAPARECIDOS_MOCK as any[]);
  return [...docs].sort((a, b) => String(a.nome).localeCompare(String(b.nome)));
}

export function subscribeDesaparecidos(callback: (dados: Desaparecido[]) => void): Unsubscribe {
  return subscrever(
    "desaparecidos",
    (docs) => [...docs].sort((a, b) => String(a.nome).localeCompare(String(b.nome))),
    DESAPARECIDOS_MOCK,
    callback,
  );
}

export async function listarRecompensas(): Promise<Recompensa[]> {
  return tentarFirestore(() => getAllOnce("recompensas"), RECOMPENSAS_MOCK as any[]);
}

export function subscribeRecompensas(callback: (dados: Recompensa[]) => void): Unsubscribe {
  return subscrever("recompensas", (docs) => docs, RECOMPENSAS_MOCK, callback);
}

export async function listarNoticias(): Promise<Noticia[]> {
  const docs = await tentarFirestore(() => getAllOnce("noticias"), NOTICIAS_MOCK as any[]);
  return [...docs].sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

export function subscribeNoticias(callback: (dados: Noticia[]) => void): Unsubscribe {
  return subscrever(
    "noticias",
    (docs) => [...docs].sort((a, b) => String(b.data).localeCompare(String(a.data))),
    NOTICIAS_MOCK,
    callback,
  );
}

// Natureza da denúncia usada no wizard (passo "O que você quer
// denunciar?") — lê a MESMA tabela usada pela apuração operacional no
// hcCore (dados/{tenant}/natureza, gerida em
// disquedenuncia/tabelas/Denuncia/Natureza), não uma lista própria do
// site. Cai no array fixo de types/wizard.ts se a coleção ainda não tiver
// sido populada ou a leitura falhar.
export async function listarNaturezas(): Promise<string[]> {
  const docs = await tentarFirestore(() => getAllOnce("natureza"), [] as any[]);
  const nomes = docs.filter((d: any) => d.status === "Ativo").map((d: any) => d.nome as string).filter(Boolean);
  return nomes.length > 0 ? nomes : [...NATUREZAS];
}

export function subscribeNaturezas(callback: (dados: string[]) => void): Unsubscribe {
  try {
    return getAll("natureza", (docs) => {
      const nomes = docs.filter((d: any) => d.status === "Ativo").map((d: any) => d.nome as string).filter(Boolean);
      callback(nomes.length > 0 ? nomes : [...NATUREZAS]);
    });
  } catch {
    callback([...NATUREZAS]);
    return () => {};
  }
}

// Só os baralhos ativos, na ordem configurada — usado tanto na navegação
// (Header) quanto na Home. Se o tenant não configurou nenhum, volta vazio
// de verdade em produção (o fallback só existe pra navegar o esqueleto).
function ordenarBaralhosAtivos(docs: any[]): Baralho[] {
  const baralhos = (docs as Baralho[]).filter((b) => b.ativo);
  return [...baralhos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

export async function listarBaralhosAtivos(): Promise<Baralho[]> {
  const docs = await tentarFirestore(() => getAllOnce("baralhos"), BARALHOS_MOCK as any[]);
  return ordenarBaralhosAtivos(docs);
}

export function subscribeBaralhosAtivos(callback: (dados: Baralho[]) => void): Unsubscribe {
  return subscrever("baralhos", ordenarBaralhosAtivos, ordenarBaralhosAtivos(BARALHOS_MOCK), callback);
}

export async function buscarBaralhoPorSlug(slug: string): Promise<Baralho | null> {
  const baralhos = await listarBaralhosAtivos();
  return baralhos.find((b) => b.slug === slug) ?? null;
}

export function subscribeBaralhoPorSlug(slug: string, callback: (dado: Baralho | null) => void): Unsubscribe {
  return subscribeBaralhosAtivos((baralhos) => callback(baralhos.find((b) => b.slug === slug) ?? null));
}

const CARTAS_MOCK: Record<string, CartaBaralho[]> = {
  crime: [
    { id: "1", baralhoId: "crime", naipe: "espadas", valor: "A", nome: "Carlos Silva", descricao: "Homicídio" },
    { id: "2", baralhoId: "crime", naipe: "ouros", valor: "K", nome: "Marcos Oliveira", descricao: "Tráfico de drogas" },
  ],
  lilas: [],
};

export async function listarCartasBaralho(baralhoId: string): Promise<CartaBaralho[]> {
  const docs = await tentarFirestore(() => getAllOnce("baralhoCartas"), CARTAS_MOCK[baralhoId] ?? []);
  return (docs as CartaBaralho[]).filter((c) => c.baralhoId === baralhoId);
}

export function subscribeCartasBaralho(baralhoId: string, callback: (dados: CartaBaralho[]) => void): Unsubscribe {
  return subscrever(
    "baralhoCartas",
    (docs) => (docs as CartaBaralho[]).filter((c) => c.baralhoId === baralhoId),
    CARTAS_MOCK[baralhoId] ?? [],
    callback,
  );
}

// Só páginas com status "Publicado" — "Rascunho" fica visível no admin
// mas não no site, mesma convenção de `ativo` nas outras coleções. Sem
// mock: se o tenant não cadastrou nenhuma, o site não tem nenhum link
// de página institucional, e tudo bem — não é uma feature obrigatória.
export async function listarPaginasPublicadas(): Promise<Pagina[]> {
  const docs = await tentarFirestore(() => getAllOnce("paginas"), [] as Pagina[]);
  return (docs as Pagina[]).filter((p) => p.status === "Publicado");
}

export function subscribePaginasPublicadas(callback: (dados: Pagina[]) => void): Unsubscribe {
  return subscrever("paginas", (docs) => (docs as Pagina[]).filter((p) => p.status === "Publicado"), [], callback);
}

export async function buscarPaginaPorSlug(slug: string): Promise<Pagina | null> {
  const paginas = await listarPaginasPublicadas();
  return paginas.find((p) => p.slug === slug) ?? null;
}

export function subscribePaginaPorSlug(slug: string, callback: (dado: Pagina | null) => void): Unsubscribe {
  return subscribePaginasPublicadas((paginas) => callback(paginas.find((p) => p.slug === slug) ?? null));
}

// Popups/banners (dados/{tenant}/avisos) — só os ativos, ordenados por
// `ordem`. Sem mock: se o tenant não cadastrou nenhum aviso, o site
// simplesmente não mostra popup/banner nenhum (não é feature obrigatória).
function ordenarAvisosAtivos(docs: any[]): Aviso[] {
  const avisos = (docs as Aviso[]).filter((a) => a.ativo !== false);
  return [...avisos].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
}

export async function listarAvisosAtivos(): Promise<Aviso[]> {
  const docs = await tentarFirestore(() => getAllOnce("avisos"), [] as Aviso[]);
  return ordenarAvisosAtivos(docs);
}

export function subscribeAvisosAtivos(callback: (dados: Aviso[]) => void): Unsubscribe {
  return subscrever("avisos", ordenarAvisosAtivos, [], callback);
}

// Doc único (não é lista) — nome do órgão, cores, contato e imagem de
// fundo da home, configurados no hcCore. Sem mock: se o tenant não
// configurou nada ainda, volta `{}` e cada consumidor usa seu próprio
// padrão (cores/imagem fixas já definidas em globals.css, textos fixos
// em Header/Footer) — igual ao comportamento de antes desta config existir.
export async function listarConfiguracao(): Promise<Configuracao> {
  try {
    const doc = await getDocOnce("configuracoes", "geral");
    return (doc as Configuracao) ?? {};
  } catch {
    return {};
  }
}
