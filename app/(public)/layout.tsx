import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import AvisosClient from "@/components/public/AvisosClient";
import AudienciaTracker from "@/components/public/AudienciaTracker";
import { AoVivoProvider } from "@/components/public/AoVivo";
import { listarBaralhosAtivos, listarPaginasPublicadas, listarAvisosAtivos, listarConfiguracao } from "@/lib/data";

export const revalidate = 300;

// Moldura do site padrão (p2pcorp): topo fixo, conteúdo, rodapé. Menu,
// páginas, avisos e configuração saem certos no HTML (SSR) e seguem ao vivo
// no navegador (AoVivoProvider e os subscribe* de cada componente).
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [baralhos, paginas, avisos, configuracao] = await Promise.all([
    listarBaralhosAtivos(),
    listarPaginasPublicadas(),
    listarAvisosAtivos(),
    listarConfiguracao(),
  ]);
  return (
    <AoVivoProvider inicial={configuracao}>
      <div className="topo-fixo">
        <Header baralhosIniciais={baralhos} paginasIniciais={paginas} />
      </div>
      <main id="conteudo">{children}</main>
      <Footer paginasIniciais={paginas} />
      <AvisosClient avisosIniciais={avisos} />
      <AudienciaTracker />
      <ChatWidget
        nomeAtendente="Central de Atendimento"
        rotuloBotao="Canal de Denúncias"
        assuntoPadrao="Atendimento pelo site — Portal 181"
        mensagemBoasVindas="Olá! Envie uma mensagem para falar com a Central de Atendimento."
      />
    </AoVivoProvider>
  );
}
