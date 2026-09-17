import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import AvisosClient from "@/components/public/AvisosClient";
import AudienciaTracker from "@/components/public/AudienciaTracker";
import { listarBaralhosAtivos, listarPaginasPublicadas, listarAvisosAtivos, listarConfiguracao } from "@/lib/data";

export const revalidate = 300;

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

// SSR real (ver next.config.js) — o menu de baralhos, as páginas
// institucionais (Header/Footer, conforme o campo `local` de cada uma) e
// os avisos (popup/banner) já saem certos no HTML (Server Component); os
// componentes client assumem dali pra frente com o listener em tempo
// real, igual às páginas de conteúdo.
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [baralhos, paginas, avisos, configuracao] = await Promise.all([
    listarBaralhosAtivos(),
    listarPaginasPublicadas(),
    listarAvisosAtivos(),
    listarConfiguracao(),
  ]);

  // Cores configuradas no hcCore (Configurações do Portal181) sobrescrevem
  // as CSS vars --navy/--blue definidas em globals.css — só quando forem
  // um hex válido, senão o site mantém as cores padrão. `display:contents`
  // faz o wrapper não afetar o layout (flex/grid dos filhos continua
  // exatamente como se ele não existisse).
  const temaVars: React.CSSProperties = {
    ...(configuracao.corPrimaria && HEX_REGEX.test(configuracao.corPrimaria)
      ? { ["--navy" as any]: configuracao.corPrimaria }
      : {}),
    ...(configuracao.corSecundaria && HEX_REGEX.test(configuracao.corSecundaria)
      ? { ["--blue" as any]: configuracao.corSecundaria }
      : {}),
  };

  return (
    <div className="contents" style={temaVars}>
      <Header baralhosIniciais={baralhos} paginasIniciais={paginas} configuracao={configuracao} />
      <main>{children}</main>
      <Footer paginasIniciais={paginas} configuracao={configuracao} />
      <AvisosClient avisosIniciais={avisos} />
      <AudienciaTracker />
      <ChatWidget
        nomeAtendente="Central de Atendimento"
        rotuloBotao="Canal de Denúncias"
        assuntoPadrao="Atendimento pelo site — Portal 181"
        mensagemBoasVindas="Olá! Envie uma mensagem para falar com a Central de Atendimento."
      />
    </div>
  );
}
