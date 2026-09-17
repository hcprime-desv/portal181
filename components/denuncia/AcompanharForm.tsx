"use client";

import { useEffect, useRef, useState } from "react";
import { getDocOnce, getDocOn, atualizarDoc } from "@/lib/firebase/gen";
import { ensureAnonAuth } from "@/lib/firebase/auth";
import { statusPublico } from "@/lib/statusDenuncia";
import Captcha, { type CaptchaHandle } from "@/components/common/Captcha";
import type { StatusDenuncia, DenunciaRegistro } from "@/types/denuncia";

const ETAPAS: { status: StatusDenuncia; label: string }[] = [
  { status: "recebida", label: "Recebida" },
  { status: "em_analise", label: "Em análise" },
  { status: "encaminhada", label: "Encaminhada" },
  { status: "em_apuracao", label: "Em apuração" },
  { status: "concluida", label: "Concluída" },
];

interface Resultado {
  protocolo: string;
  status: StatusDenuncia;
  historico: { status: StatusDenuncia; data: number }[];
}

export default function AcompanharForm() {
  const [protocolo, setProtocolo] = useState("");
  const [captchaValido, setCaptchaValido] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);
  // Só é setado depois de uma consulta com captcha válido — a partir daí
  // vira um listener (useEffect abaixo), então mudanças de status feitas
  // na apuração operacional (hcCore) aparecem aqui sem precisar consultar
  // de novo. O captcha protege a BUSCA inicial (desencoraja varredura de
  // protocolo em protocolo), não o acompanhamento em si.
  const [protocoloConfirmado, setProtocoloConfirmado] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [complemento, setComplemento] = useState("");
  const [complementoEnviado, setComplementoEnviado] = useState(false);

  useEffect(() => {
    if (!protocoloConfirmado) return;
    const unsub = getDocOn("denuncias", protocoloConfirmado, (doc: (DenunciaRegistro & { id: string }) | null) => {
      if (!doc) {
        setResultado(null);
        setErro("Protocolo não encontrado");
        return;
      }
      // O status "bonito" pro cidadão vem sempre de `status_denuncia`
      // (vocabulário operacional real) — nunca do `status` gravado
      // ("novo"/"finalizado"...), que é interno da apuração.
      setResultado({
        protocolo: doc.id,
        status: statusPublico(doc.status_denuncia),
        historico: doc.historico,
      });
    });
    return () => unsub();
  }, [protocoloConfirmado]);

  async function consultar() {
    if (!captchaValido) return;
    setCarregando(true);
    setErro(null);
    setResultado(null);
    setComplementoEnviado(false);
    try {
      await ensureAnonAuth();
      const doc = (await getDocOnce("denuncias", protocolo.trim())) as (DenunciaRegistro & { id: string }) | null;
      if (!doc) {
        setErro("Protocolo não encontrado");
        setProtocoloConfirmado(null);
        return;
      }
      setProtocoloConfirmado(doc.id);
    } catch (e: any) {
      console.error(e);
      setErro("Não foi possível consultar agora.");
    } finally {
      setCarregando(false);
      captchaRef.current?.regenerar();
      setCaptchaValido(false);
    }
  }

  async function enviarComplemento() {
    if (!complemento.trim() || !resultado) return;
    try {
      await ensureAnonAuth();
      const doc = (await getDocOnce("denuncias", resultado.protocolo)) as (DenunciaRegistro & { id: string }) | null;
      if (!doc) return;
      await atualizarDoc("denuncias", resultado.protocolo, {
        complementos: [...(doc.complementos ?? []), { texto: complemento, data: Date.now() }],
        atualizadaEm: Date.now(),
      });
      setComplementoEnviado(true);
      setComplemento("");
    } catch (e) {
      console.error(e);
    }
  }

  const indiceAtual = resultado ? ETAPAS.findIndex((e) => e.status === resultado.status) : -1;

  return (
    <div className="track">
      <div className="panel">
        <div className="panel-body">
          <div className="field">
            <label>Número do protocolo</label>
            <input
              value={protocolo}
              onChange={(e) => setProtocolo(e.target.value)}
              placeholder="20260424.500000.153045123"
            />
          </div>
          <Captcha ref={captchaRef} onChange={setCaptchaValido} className="field" />
          {erro && <p style={{ color: "var(--red)", fontWeight: 700, marginTop: 12 }}>{erro}</p>}
          <button
            type="button"
            className="btn btn-blue"
            style={{ width: "100%", marginTop: 18 }}
            onClick={consultar}
            disabled={carregando || !protocolo || !captchaValido}
          >
            {carregando ? "Consultando..." : "Consultar"}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <h3>Situação da denúncia</h3>
          {!resultado && <p style={{ color: "var(--muted)" }}>Informe o protocolo ao lado para ver o andamento.</p>}
          {resultado && (
            <>
              <div className="timeline">
                {ETAPAS.map((etapa, i) => (
                  <div
                    className={`event${i < indiceAtual ? " done" : i === indiceAtual ? " current" : ""}`}
                    key={etapa.status}
                  >
                    <strong>{etapa.label}</strong>
                    {i === indiceAtual && <small>Situação atual</small>}
                  </div>
                ))}
              </div>

              {!complementoEnviado ? (
                <div style={{ marginTop: 16 }}>
                  <div className="field full">
                    <label>Tenho novas informações sobre esta denúncia</label>
                    <textarea
                      value={complemento}
                      onChange={(e) => setComplemento(e.target.value)}
                      placeholder="Descreva a nova informação..."
                    />
                  </div>
                  <button type="button" className="btn btn-outline" onClick={enviarComplemento}>
                    Enviar complemento
                  </button>
                </div>
              ) : (
                <p style={{ color: "var(--green)", fontWeight: 700, marginTop: 16 }}>
                  Informação complementar registrada. Obrigado!
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
