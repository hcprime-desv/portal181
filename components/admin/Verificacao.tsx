"use client";
// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/layout/src/sites/admin e copie de novo.
// VERIFICAÇÃO DE SEGURANÇA INVISÍVEL do login do /admin dos sites (dono, 12/11/2026) — a MESMA dos painéis
// (packages/components/src/PuzzleCaptcha.tsx; os sites não usam @hc/*, por isso a cópia no kit).
import React, { useCallback, useEffect, useRef, useState } from "react";

interface PuzzleCaptchaProps {
  verified: boolean;
  onVerifiedChange: (verificado: boolean) => void;
  /** muda esse valor para refazer a verificação (ex.: depois de um login que falhou) */
  resetTrigger?: any;
}

const TEMPO_MINIMO_MS = 1200;
const INTERACOES_MINIMAS = 2;

const caixa: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, minHeight: 44, width: "100%", minWidth: 300, padding: "0 14px",
  borderRadius: 10, border: "1px solid rgba(127,150,190,.38)", background: "rgba(127,150,190,.08)", fontSize: 14, fontWeight: 600,
};

function Deslizar({ aoConcluir }: { aoConcluir: () => void }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [arrastando, setArrastando] = useState(false);
  const inicio = useRef(0);
  const max = () => (trilho.current ? trilho.current.clientWidth - 40 : 240);
  const mover = useCallback((clientX: number) => {
    const r = trilho.current?.getBoundingClientRect();
    if (!r) return;
    setX(Math.max(0, Math.min(max(), clientX - r.left - 20)));
  }, []);
  useEffect(() => {
    if (!arrastando) return;
    const m = (e: PointerEvent) => mover(e.clientX);
    const fim = () => {
      setArrastando(false);
      setX((atual) => {
        // chegou ao fim, e não num salto instantâneo (robô)
        if (atual >= max() - 4 && Date.now() - inicio.current > 250) { aoConcluir(); return max(); }
        return 0;
      });
    };
    window.addEventListener("pointermove", m);
    window.addEventListener("pointerup", fim);
    return () => { window.removeEventListener("pointermove", m); window.removeEventListener("pointerup", fim); };
  }, [arrastando, mover, aoConcluir]);
  const pct = trilho.current ? (x / Math.max(1, max())) * 100 : 0;
  return (
    <div ref={trilho} style={{ ...caixa, position: "relative", padding: 0, justifyContent: "center", borderRadius: 999, overflow: "hidden", userSelect: "none", touchAction: "none" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `calc(${pct}% + 40px)`, background: "linear-gradient(90deg,rgba(31,95,191,.55),rgba(14,143,110,.55))" }} />
      <span style={{ position: "relative", color: "inherit", fontWeight: 700, paddingLeft: 30 }}>Deslize para confirmar ➜</span>
      <div
        onPointerDown={(e) => { e.preventDefault(); inicio.current = Date.now(); setArrastando(true); }}
        role="slider" aria-label="Deslize para confirmar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} tabIndex={0}
        style={{ position: "absolute", left: x + 2, top: 2, width: 38, height: 38, borderRadius: "50%", background: "#fff", color: "#0E8F6E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, cursor: "grab", boxShadow: "0 2px 8px rgba(0,0,0,.25)" }}
      >➜</div>
    </div>
  );
}

const VerificacaoSeguranca: React.FC<PuzzleCaptchaProps> = ({ verified, onVerifiedChange, resetTrigger }) => {
  const [suspeito, setSuspeito] = useState(false);
  const inicio = useRef(Date.now());
  const interacoes = useRef(0);
  const isca = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inicio.current = Date.now();
    interacoes.current = 0;
    setSuspeito(false);
    onVerifiedChange(false);
  }, [resetTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof navigator !== "undefined" && (navigator as any).webdriver) setSuspeito(true);
    const contar = () => { interacoes.current += 1; };
    const eventos = ["pointermove", "pointerdown", "keydown", "touchstart"];
    eventos.forEach((e) => window.addEventListener(e, contar, { passive: true }));
    const t = setInterval(() => {
      if (isca.current?.value) { setSuspeito(true); return; }
      if (!verified && !suspeito && Date.now() - inicio.current >= TEMPO_MINIMO_MS && interacoes.current >= INTERACOES_MINIMAS) onVerifiedChange(true);
    }, 300);
    return () => { clearInterval(t); eventos.forEach((e) => window.removeEventListener(e, contar)); };
  }, [verified, suspeito, onVerifiedChange]);

  return (
    <div style={{ width: "100%" }}>
      {/* campo-isca: invisível para pessoas; robô que preenche vira "suspeito" */}
      <input ref={isca} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        style={{ position: "absolute", left: -10000, width: 1, height: 1, opacity: 0 }} />
      {verified ? (
        <div style={{ ...caixa, color: "#22c55e" }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: "#16a34a", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>✓</span>
          <span>Verificação automática concluída</span>
          <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.7 }}>🔒 seguro</span>
        </div>
      ) : suspeito ? (
        <Deslizar aoConcluir={() => onVerifiedChange(true)} />
      ) : (
        <div style={{ ...caixa, opacity: 0.85 }}>
          <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid currentColor", borderTopColor: "transparent", display: "inline-block", animation: "hcgirar .8s linear infinite" }} />
          <span>Verificando a segurança…</span>
          <style>{"@keyframes hcgirar{to{transform:rotate(360deg)}}"}</style>
        </div>
      )}
    </div>
  );
};

export default VerificacaoSeguranca;
