import Link from "next/link";
import { Send, Search, Phone, Eye, Shield, CheckCircle2, ScanSearch, UserSearch, Trophy, Megaphone } from "lucide-react";
import { listarNoticias, listarBaralhosAtivos, listarConfiguracao } from "@/lib/data";
import HomeDestaques from "@/components/public/HomeDestaques";

export const revalidate = 300;

export default async function HomePage() {
  const [noticias, baralhos, configuracao] = await Promise.all([
    listarNoticias(),
    listarBaralhosAtivos(),
    listarConfiguracao(),
  ]);

  // Foto de fundo configurada no hcCore (Configurações do Portal181)
  // sobrescreve a imagem fixa de globals.css — mantém o mesmo overlay
  // escuro (pro texto continuar legível em qualquer foto usada).
  const heroStyle = configuracao.imagemFundoUrl
    ? {
        backgroundImage: `linear-gradient(120deg, rgba(6, 6, 22, 0.34), rgba(2, 18, 33, 0.55)), url(${configuracao.imagemFundoUrl})`,
      }
    : undefined;

  return (
    <>
      <section className="hero" style={heroStyle}>
        <div className="wrap">
          <div>
            <div className="eyebrow">Canal seguro e sigiloso</div>
            <h1>
              VIU? SABE?
              <br />
              <span>DENUNCIE.</span>
            </h1>
            <p>
              Sua informação pode fazer a diferença. Denuncie de forma anônima, segura e
              protegida.
            </p>
            <div className="actions">
              <Link href="/denuncie" className="btn btn-red">
                <Send size={18} /> FAZER UMA DENÚNCIA
              </Link>
              <Link href="/acompanhar" className="btn btn-blue">
                <Search size={18} /> ACOMPANHAR PROTOCOLO
              </Link>
              <a href="tel:181" className="btn btn-white">
                <Phone size={18} /> LIGAR 181
              </a>
            </div>
          </div>

          <div className="hero-badges">
            <div className="badge">
              <strong>
                <Eye size={16} className="inline mr-1" /> ANÔNIMO
              </strong>
              Sua identidade é preservada.
            </div>
            <div className="badge">
              <strong>
                <Shield size={16} className="inline mr-1" /> SEGURO
              </strong>
              Seus dados são protegidos.
            </div>
            <div className="badge">
              <strong>
                <CheckCircle2 size={16} className="inline mr-1" /> EFETIVO
              </strong>
              Sua informação pode salvar vidas.
            </div>
          </div>
        </div>
      </section>

      <section>
        <br></br>
        <div className="wrap">
          <div className="cards">
            <Link href="/procurados" className="card">
              <div className="icon">
                <ScanSearch size={22} />
              </div>
              <h3>Procurados</h3>
              <p>Pessoas procuradas pela Justiça. Ajude com informações.</p>
            </Link>
            <Link href="/desaparecidos" className="card">
              <div className="icon">
                <UserSearch size={22} />
              </div>
              <h3>Desaparecidos</h3>
              <p>Ajude famílias e autoridades a localizar pessoas desaparecidas.</p>
            </Link>
            <Link href="/recompensas" className="card">
              <div className="icon">
                <Trophy size={22} />
              </div>
              <h3>Recompensas</h3>
              <p>Consulte casos com recompensas oficialmente divulgadas.</p>
            </Link>
            <Link href="/noticias" className="card">
              <div className="icon">
                <Megaphone size={22} />
              </div>
              <h3>Resultados do 181</h3>
              <p>Veja resultados obtidos com a colaboração da população.</p>
            </Link>
          </div>
        </div>
      </section>

      <HomeDestaques noticiasIniciais={noticias.slice(0, 4)} baralhosIniciais={baralhos} />
    </>
  );
}
