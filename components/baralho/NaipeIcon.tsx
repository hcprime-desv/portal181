// Ícone do naipe — cobre os 4 clássicos (ouros/espadas/paus/copas) e cai
// num rótulo genérico pra qualquer outro nome que um tenant configure
// (o conceito de "baralho" não é fixo aos 4 naipes de baralho comum).
const SIMBOLOS: Record<string, { simbolo: string; cor: "red" | "black" }> = {
  ouros: { simbolo: "♦", cor: "red" },
  copas: { simbolo: "♥", cor: "red" },
  espadas: { simbolo: "♠", cor: "black" },
  paus: { simbolo: "♣", cor: "black" },
};

export default function NaipeIcon({ naipe }: { naipe: string }) {
  const info = SIMBOLOS[naipe.toLowerCase()];
  if (!info) return <span>{naipe}</span>;
  return <span className={`suit-${info.cor}`}>{info.simbolo}</span>;
}

export function corNaipe(naipe: string): "red" | "black" {
  return SIMBOLOS[naipe.toLowerCase()]?.cor ?? "black";
}
