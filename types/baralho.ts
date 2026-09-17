// "Baralho do Crime" / "Baralho Lilás" (ver
// https://disquedenuncia.ssp.ba.gov.br/) — mas modelado de forma genérica,
// porque cada estado/implantação pode ter naipes diferentes, quantidade
// diferente de baralhos, ou nenhum baralho — tudo isso é configurado no
// Firestore (`dados/{tenant}/baralhos` e `.../baralhoCartas`), não fixo no
// código.

export interface Baralho {
  id: string;
  slug: string; // usado na URL: /baralho/[slug]
  nome: string; // ex: "Baralho do Crime", "Baralho Lilás"
  naipes: string[]; // ex: ["ouros","espadas","paus","copas"] — mas o estado define
  ativo: boolean;
  ordem?: number;
}

export interface CartaBaralho {
  id: string;
  baralhoId: string;
  naipe: string;
  valor: string; // "A","2".."10","J","Q","K"
  procuradoId?: string; // referência a um doc em dados/{tenant}/procurados
  nome?: string; // se não estiver vinculado a um Procurado formal
  fotoUrl?: string;
  descricao?: string;
}
