import { PASSOS } from "@/types/wizard";

// Etapas da denúncia (.etapas — o .step do site padrão é o "Como funciona").
export default function StepIndicator({ atual }: { atual: number }) {
  return (
    <div className="etapas">
      {PASSOS.map((label, i) => {
        const n = i + 1;
        const cls = n === atual ? "etapa ativa" : n < atual ? "etapa feita" : "etapa";
        return (
          <div className={cls} key={label}>
            <div className="circulo">{n}</div>
            {label}
          </div>
        );
      })}
    </div>
  );
}
