import Link from "next/link";
import { ChevronRight, Clock, Eye, Lock, Phone, Search, Send, Shield, CheckCircle2 } from "lucide-react";
import { listarNoticias, listarBaralhosAtivos, listarConfiguracao } from "@/lib/data";
import HomeDestaques from "@/components/public/HomeDestaques";

export const revalidate = 300;

// Banner padrão do Portal 181 — vale enquanto a Configuração do site (/admin)
// não tiver "Imagem de fundo (topo do site)".
const BANNER_PADRAO = "/images/hero-bg.jpg";

// Botão grande em duas linhas (como o do site padrão).
function BotaoGrande({ href, linha1, linha2, icone, classe }: { href: string; linha1: string; linha2: string; icone: React.ReactNode; classe: string }) {
  return (
    <Link href={href} className={`btn btn-grande ${classe}`}>
      {icone}<span><b>{linha1}</b><small>{linha2}</small></span><ChevronRight size={20} aria-hidden />
    </Link>
  );
}

const PASSOS = [
  { titulo: "Denuncie", texto: "Pelo site, pelo chat ou ligando 181. Você não precisa se identificar." },
  { titulo: "Guarde o protocolo", texto: "Você recebe o número do protocolo e um código de segurança." },
  { titulo: "Acompanhe", texto: "Consulte o andamento quando quiser e envie novas informações." },
  { titulo: "Resultados", texto: "A informação chega aos órgãos responsáveis e ajuda a salvar vidas." },
];

export default async function HomePage() {
  const [noticias, baralhos, configuracao] = await Promise.all([listarNoticias(), listarBaralhosAtivos(), listarConfiguracao()]);
  const banner = configuracao.imagemFundoUrl || BANNER_PADRAO;
  const denunciar = configuracao.menuDenuncie !== false;
  return (
    <>
      <section className="hero" id="inicio">
        <div className="hero-bg" style={{ ["--banner" as any]: `url('${banner}')`, ["--banner-mobile" as any]: `url('${banner}')` }} />
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow">Canal seguro e sigiloso</div>
            <h1>Viu? Sabe?<span className="vermelho">Denuncie.</span></h1>
            <p>Sua informação pode fazer a diferença. Denuncie de forma anônima, segura e protegida.</p>
            <div className="hero-actions">
              {denunciar && <BotaoGrande href="/denuncie" linha1="Fazer uma denúncia" linha2="anônima e segura" classe="btn-red" icone={<Send size={28} aria-hidden />} />}
              <BotaoGrande href="/acompanhar" linha1="Acompanhar" linha2="o seu protocolo" classe="btn-outline-green" icone={<Search size={28} aria-hidden />} />
            </div>
            <div className="chips">
              <a className="chip" href="tel:181"><span className="chip-ic"><Phone size={18} /></span>Ligue 181, é grátis</a>
              <span className="chip"><span className="chip-ic"><Lock size={18} /></span>Sigilo garantido</span>
              <span className="chip"><span className="chip-ic"><Clock size={18} /></span>24 horas</span>
            </div>
          </div>
          <div className="hero-numeros">
            <div className="numero"><span className="numero-ic"><Eye size={22} /></span><div><strong>Anônimo</strong><span>Sua identidade é preservada.</span></div></div>
            <div className="numero"><span className="numero-ic"><Shield size={22} /></span><div><strong>Seguro</strong><span>Seus dados são protegidos.</span></div></div>
            <div className="numero"><span className="numero-ic"><CheckCircle2 size={22} /></span><div><strong>Efetivo</strong><span>Sua informação pode salvar vidas.</span></div></div>
          </div>
        </div>
      </section>

      <HomeDestaques noticiasIniciais={noticias.slice(0, 3)} baralhosIniciais={baralhos} />

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="eyebrow">Como funciona</div>
              <h2>Da sua informação <span className="destaque">ao resultado</span></h2>
            </div>
            <p>O 181 é um canal de comunicação entre o cidadão e a segurança pública: rápido, sigiloso e sem identificação.</p>
          </div>
          <div className="flow">
            {PASSOS.map((p) => <div className="step" key={p.titulo}><strong>{p.titulo}</strong><p>{p.texto}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <div className="cta">
            <div>
              <div className="eyebrow">Disque Denúncia</div>
              <h2>Viu algo suspeito? Conte para a gente.</h2>
              <p>Não é preciso se identificar. Cada informação é analisada e encaminhada aos órgãos responsáveis.</p>
            </div>
            <div className="cta-acoes">
              {denunciar && <Link href="/denuncie" className="btn btn-red"><Send size={18} /> Fazer denúncia</Link>}
              <a href="tel:181" className="btn btn-outline"><Phone size={18} /> Ligar 181</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
