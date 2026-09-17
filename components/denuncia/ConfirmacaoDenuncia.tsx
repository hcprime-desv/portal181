import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ConfirmacaoDenuncia({
  protocolo,
  onNovaDenuncia,
}: {
  protocolo: string;
  onNovaDenuncia: () => void;
}) {
  return (
    <div className="panel" style={{ maxWidth: 720, margin: "auto", textAlign: "center" }}>
      <div className="panel-body" style={{ padding: 55 }}>
        <CheckCircle2 size={70} color="var(--green)" style={{ margin: "0 auto" }} />
        <h2>Denúncia registrada com sucesso!</h2>
        <h3 style={{ color: "var(--navy)" }}>Protocolo: {protocolo}</h3>
        <p style={{ color: "var(--muted)" }}>
          Guarde o protocolo para acompanhar sua denúncia. Nenhum dado de identificação pessoal é
          obrigatório.
        </p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <Link href="/acompanhar" className="btn btn-blue">
            Acompanhar denúncia
          </Link>
          <button type="button" className="btn btn-outline" onClick={onNovaDenuncia}>
            Nova denúncia
          </button>
        </div>
      </div>
    </div>
  );
}
