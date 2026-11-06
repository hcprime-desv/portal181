"use client";

// Faixa de cartões logo abaixo do banner (.faixa-cards/.cards8 do site
// padrão) e as últimas notícias — começam com o dado do servidor (SSR) e
// seguem ao vivo (baralhos e notícias editados no /admin aparecem na hora).
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Megaphone, Search, Send, Spade, Trophy, UserSearch, ScanSearch } from "lucide-react";
import { subscribeNoticias, subscribeBaralhosAtivos } from "@/lib/data";
import { useConfiguracao } from "./AoVivo";
import { Card8, CartaoNoticia } from "./Cartoes";
import type { Noticia } from "@/types/conteudo";
import type { Baralho } from "@/types/baralho";

export default function HomeDestaques({ noticiasIniciais, baralhosIniciais }: { noticiasIniciais: Noticia[]; baralhosIniciais: Baralho[] }) {
  const c = useConfiguracao();
  const [noticias, setNoticias] = useState<Noticia[]>(noticiasIniciais);
  const [baralhos, setBaralhos] = useState<Baralho[]>(baralhosIniciais);

  useEffect(() => subscribeNoticias((n) => setNoticias(n.slice(0, 3))), []);
  useEffect(() => subscribeBaralhosAtivos(setBaralhos), []);

  return (
    <>
      <section className="container faixa-cards">
        <div className="cards8 auto">
          {c.menuDenuncie !== false && <Card8 icone={<Send size={22} />} cor="vermelho" titulo="Fazer denúncia" texto="Anônima, segura e protegida. Leva poucos minutos." href="/denuncie" saiba="Denunciar" />}
          <Card8 icone={<Search size={22} />} cor="azul" titulo="Acompanhar" texto="Consulte o andamento com o protocolo e o código de segurança." href="/acompanhar" saiba="Consultar" />
          {c.menuProcurados !== false && <Card8 icone={<ScanSearch size={22} />} cor="roxo" titulo="Procurados" texto="Pessoas procuradas pela Justiça. Ajude com informações." href="/procurados" />}
          {c.menuDesaparecidos !== false && <Card8 icone={<UserSearch size={22} />} cor="verde" titulo="Desaparecidos" texto="Ajude famílias e autoridades a localizar pessoas desaparecidas." href="/desaparecidos" />}
          {c.menuRecompensas !== false && <Card8 icone={<Trophy size={22} />} cor="laranja" titulo="Recompensas" texto="Casos com recompensas oficialmente divulgadas." href="/recompensas" />}
          {c.menuNoticias !== false && <Card8 icone={<Megaphone size={22} />} cor="azul" titulo="Resultados do 181" texto="Resultados obtidos com a colaboração da população." href="/noticias" />}
          {c.menuBaralhos !== false && baralhos.map((b) => (
            <Card8 key={b.id} icone={<Spade size={22} />} cor="cinza" titulo={b.nome} texto={`Pessoas procuradas organizadas por naipe (${b.naipes.length} naipes).`} href={`/baralho/${b.slug}`} saiba="Ver cartas" />
          ))}
        </div>
      </section>

      {c.menuNoticias !== false && noticias.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <div>
                <div className="eyebrow">Notícias</div>
                <h2>Últimas <span className="destaque">notícias</span></h2>
              </div>
              <Link href="/noticias" className="btn btn-outline">Ver todas <ArrowRight size={16} /></Link>
            </div>
            <div className="grade-noticias">{noticias.map((n) => <CartaoNoticia key={n.id} n={n} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
