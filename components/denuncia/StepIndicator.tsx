import { PASSOS } from "@/types/wizard";

export default function StepIndicator({ atual }: { atual: number }) {
  return (
    <div className="steps">
      {PASSOS.map((label, i) => {
        const n = i + 1;
        const cls = n === atual ? "step active" : n < atual ? "step done" : "step";
        return (
          <div className={cls} key={label}>
            <div className="circle">{n}</div>
            {label}
          </div>
        );
      })}
    </div>
  );
}
