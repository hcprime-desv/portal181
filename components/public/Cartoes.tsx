// Cartões do site padrão (p2pcorp/ViaMob360): .card8 (círculo colorido,
// título, texto e "Saiba mais") e .card-noticia.
import Link from "next/link";
import { ArrowRight, CalendarDays, FileText } from "lucide-react";
import type { Noticia } from "@/types/conteudo";

export type CorCartao = "azul" | "verde" | "roxo" | "laranja" | "vermelho" | "cinza";

export function Card8({ icone, cor, titulo, texto, href, saiba = "Saiba mais" }: {
  icone: React.ReactNode; cor: CorCartao; titulo: string; texto?: string; href?: string; saiba?: string;
}) {
  const corpo = (
    <>
      <span className={`icon-circ ${cor}`}>{icone}</span>
      <h3>{titulo}</h3>
      <p>{texto}</p>
      {href && <span className="saiba">{saiba} <ArrowRight size={15} /></span>}
    </>
  );
  const classe = `card8${cor === "vermelho" ? " destaque" : ""}`;
  if (!href) return <div className={classe}>{corpo}</div>;
  return href.startsWith("tel:") ? <a href={href} className={classe}>{corpo}</a> : <Link href={href} className={classe}>{corpo}</Link>;
}

export function CartaoNoticia({ n }: { n: Noticia }) {
  return (
    <article className="card card-noticia">
      {n.imagemUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={n.imagemUrl} alt="" />
        : <span className="sem-img" aria-hidden><FileText size={34} /></span>}
      <div className="corpo">
        {n.data && <small><CalendarDays size={14} /> {n.data}</small>}
        <h3>{n.titulo}</h3>
        {n.resumo && <p>{n.resumo}</p>}
      </div>
    </article>
  );
}
