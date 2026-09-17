"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface CaptchaHandle {
  /** Gera uma conta nova (chame depois de uma tentativa, certa ou errada). */
  regenerar: () => void;
}

interface CaptchaProps {
  /** Chamado sempre que o valor digitado muda, informando se a conta está certa. */
  onChange: (valido: boolean) => void;
  className?: string;
}

// Captcha simples — uma conta de somar mostrada na tela, sem serviço
// externo nenhum. Não é à prova de bot sofisticado (um script que lê o
// DOM resolve fácil), mas cobre o caso comum de spam automatizado bruto,
// e é reutilizável em qualquer formulário público do site (denúncia,
// acompanhar protocolo).
const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(function Captcha({ onChange, className }, ref) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [resposta, setResposta] = useState("");

  function gerar() {
    setA(Math.floor(Math.random() * 9) + 1);
    setB(Math.floor(Math.random() * 9) + 1);
    setResposta("");
  }

  useEffect(gerar, []);
  useImperativeHandle(ref, () => ({ regenerar: gerar }));

  useEffect(() => {
    onChange(resposta.trim() !== "" && Number(resposta) === a + b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resposta, a, b]);

  return (
    <div className={className ?? "field"}>
      <label>
        Quanto é {a} + {b}?
      </label>
      <input
        type="number"
        inputMode="numeric"
        value={resposta}
        onChange={(e) => setResposta(e.target.value)}
        placeholder="Digite o resultado"
      />
    </div>
  );
});

export default Captcha;
