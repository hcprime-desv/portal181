import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Shield, CheckCircle2, HeartHandshake, Send, Phone } from "lucide-react";
import Pagina from "@/components/public/CabecalhoPagina";

export const metadata: Metadata = { title: "Como funciona o 181" };

const ITENS = [
  { icon: Eye, cor: "azul", titulo: "Anônimo", texto: "Você não precisa se identificar." },
  { icon: Shield, cor: "verde", titulo: "Seguro", texto: "Seus dados são protegidos." },
  { icon: CheckCircle2, cor: "roxo", titulo: "Eficiente", texto: "A informação é encaminhada aos órgãos responsáveis." },
  { icon: HeartHandshake, cor: "laranja", titulo: "Resultados", texto: "Denúncias ajudam a salvar vidas." },
];

export default function SobrePage() {
  return (
    <Pagina chamada="Disque Denúncia" titulo="Como funciona o 181" resumo="O 181 é um canal de comunicação entre o cidadão e a segurança pública.">
      <div className="grade-numeros">
        {ITENS.map(({ icon: Icon, cor, titulo, texto }) => (
          <div className="card" key={titulo}>
            <span className={`icon-circ ${cor}`}><Icon size={22} /></span>
            <div><strong>{titulo}</strong><span>{texto}</span></div>
          </div>
        ))}
      </div>
      <div className="cta" style={{ marginTop: 34 }}>
        <div>
          <h2>Pronto para ajudar?</h2>
          <p>Faça a sua denúncia pelo site ou ligue 181. É gratuito e sigiloso.</p>
        </div>
        <div className="cta-acoes">
          <Link href="/denuncie" className="btn btn-red"><Send size={18} /> Fazer denúncia</Link>
          <a href="tel:181" className="btn btn-outline"><Phone size={18} /> Ligar 181</a>
        </div>
      </div>
    </Pagina>
  );
}
