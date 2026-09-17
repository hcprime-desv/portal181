import type { Metadata } from "next";
import { Eye, Shield, CheckCircle2, HeartHandshake } from "lucide-react";

export const metadata: Metadata = { title: "Como funciona o 181" };

const ITENS = [
  { icon: Eye, titulo: "Anônimo", texto: "Você não precisa se identificar." },
  { icon: Shield, titulo: "Seguro", texto: "Seus dados são protegidos." },
  { icon: CheckCircle2, titulo: "Eficiente", texto: "A informação é encaminhada aos órgãos responsáveis." },
  { icon: HeartHandshake, titulo: "Resultados", texto: "Denúncias ajudam a salvar vidas." },
];

export default function SobrePage() {
  return (
    <div className="wrap">
      <div className="pagehead">
        <h1>Como funciona o 181</h1>
        <p>O 181 é um canal de comunicação entre o cidadão e a segurança pública.</p>
      </div>

      <div className="panel">
        <div className="panel-body">
          <div className="cards">
            {ITENS.map(({ icon: Icon, titulo, texto }) => (
              <div className="card" key={titulo}>
                <div className="icon">
                  <Icon size={22} />
                </div>
                <h3>{titulo}</h3>
                <p>{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
