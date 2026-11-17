"use client";
// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/layout/src/sites/admin e copie de novo.

// /admin dos SITES — campos do formulário (mesmo visual de .campo do site).
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import Markdown from "@/components/public/Markdown";
import { ouvir, subirArquivo } from "@/lib/admin/banco";
import type { Campo, Opcao } from "@/lib/admin/tipos";

const HEX = /^#[0-9A-Fa-f]{6}$/;
const DATA = /^\d{2}\/\d{2}\/\d{4}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mascaraData = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join("/");
};
// milissegundos ↔ valor do <input type="datetime-local"> (hora local)
const msParaLocal = (ms: any) => {
  const n = Number(ms);
  if (!n) return "";
  const d = new Date(n - new Date(n).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

// Valores iniciais do formulário a partir do registro (ou dos padrões).
export function valoresIniciais(campos: Campo[], registro: Record<string, any> | null): Record<string, any> {
  const v: Record<string, any> = {};
  campos.forEach((c) => {
    const atual = registro?.[c.nome];
    if (c.tipo === "senha") v[c.nome] = "";
    else if (c.tipo === "lista") v[c.nome] = Array.isArray(atual) ? atual.join(", ") : atual ?? "";
    else if (c.tipo === "linhas") v[c.nome] = Array.isArray(atual) ? atual.join("\n") : atual ?? "";
    else if (c.tipo === "datahora") v[c.nome] = msParaLocal(atual);
    else if (c.tipo === "permissoes") v[c.nome] = Array.isArray(atual) ? atual : [];
    else if (c.tipo === "check") v[c.nome] = atual ?? c.padrao ?? false;
    else v[c.nome] = atual ?? c.padrao ?? "";
  });
  return v;
}

// Confere e converte para gravar: devolve os dados ou a 1ª mensagem de erro.
export function validar(campos: Campo[], v: Record<string, any>): Record<string, any> | string {
  const saida: Record<string, any> = {};
  for (const c of campos) {
    let x = v[c.nome];
    if (typeof x === "string" && c.tipo !== "markdown" && c.tipo !== "textarea" && c.tipo !== "linhas") x = x.trim();
    const vazio = x === "" || x === undefined || x === null || (Array.isArray(x) && !x.length);
    if (c.obrigatorio && vazio && c.tipo !== "check") return `Preencha "${c.rotulo}".`;
    if (!vazio && c.tipo === "data" && !DATA.test(x)) return `"${c.rotulo}": use o formato dd/mm/aaaa.`;
    if (!vazio && c.tipo === "cor" && !HEX.test(x)) return `"${c.rotulo}": use o formato #RRGGBB.`;
    if (!vazio && c.tipo === "email" && !EMAIL.test(x)) return `"${c.rotulo}": e-mail inválido.`;
    if (c.tipo === "numero") x = vazio ? null : Number(x);
    if (c.tipo === "numero" && x !== null && Number.isNaN(x)) return `"${c.rotulo}": informe um número.`;
    if (c.tipo === "lista") x = String(x || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (c.tipo === "linhas") x = String(x || "").split("\n").map((s) => s.trim()).filter(Boolean);
    if (c.tipo === "datahora") x = vazio ? null : new Date(x).getTime();
    if (c.tipo === "check") x = !!x;
    saida[c.nome] = x;
  }
  return saida;
}

// Opções de select (fixas ou lidas de outra coleção, ao vivo).
export function useOpcoes(campo: Campo): Opcao[] {
  const [lidas, setLidas] = useState<Opcao[]>([]);
  const fonte = campo.fonte;
  useEffect(() => {
    if (!fonte) return;
    return ouvir(fonte.colecao, (docs) =>
      setLidas(docs.filter(fonte.filtro ?? (() => true)).map((d) => ({ valor: String(d.id), rotulo: String(d[fonte.rotulo] ?? d.id) }))
        .sort((a, b) => a.rotulo.localeCompare(b.rotulo))),
    );
  }, [fonte?.colecao]); // eslint-disable-line react-hooks/exhaustive-deps
  return campo.opcoes ?? lidas;
}

function CampoImagem({ valor, mudar }: { valor: string; mudar: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const escolher = async (f?: File) => {
    if (!f) return;
    setEnviando(true); setErro("");
    try { mudar(await subirArquivo(f)); } catch { setErro("Não foi possível enviar a imagem."); }
    finally { setEnviando(false); if (ref.current) ref.current.value = ""; }
  };
  return (
    <>
      <div className="adm-imagem">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {valor && <img src={valor} alt="" />}
        <button type="button" className="btn btn-outline" onClick={() => ref.current?.click()} disabled={enviando}>
          <ImagePlus size={16} /> {enviando ? "Enviando..." : valor ? "Trocar" : "Enviar imagem"}
        </button>
        {valor && <button type="button" className="btn btn-outline" onClick={() => mudar("")}><Trash2 size={16} /> Tirar</button>}
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => escolher(e.target.files?.[0])} />
      </div>
      <input type="url" value={valor} onChange={(e) => mudar(e.target.value)} placeholder="ou cole o endereço da imagem (https://...)" />
      {erro && <em>{erro}</em>}
    </>
  );
}

function CampoMarkdown({ valor, mudar, id }: { valor: string; mudar: (v: string) => void; id: string }) {
  const [previa, setPrevia] = useState(false);
  return (
    <>
      <div className="adm-md-abas" role="tablist">
        <button type="button" className={previa ? "" : "ativa"} onClick={() => setPrevia(false)}>Escrever</button>
        <button type="button" className={previa ? "ativa" : ""} onClick={() => setPrevia(true)}>Pré-visualizar</button>
      </div>
      {previa
        ? <div className="adm-md-previa markdown-body"><Markdown>{valor}</Markdown></div>
        : <textarea id={id} className="grande" value={valor} onChange={(e) => mudar(e.target.value)} />}
      <small>Markdown: **negrito**, *itálico*, ## título, - lista, [texto](https://link).</small>
    </>
  );
}

export function CampoForm({ campo: c, valor, mudar }: { campo: Campo; valor: any; mudar: (v: any) => void }) {
  const opcoes = useOpcoes(c);
  const id = `campo-${c.nome}`;
  const classe = `campo${c.largura === 3 || c.tipo === "markdown" ? " largo" : c.largura === 2 ? " dois" : ""}`;
  if (c.tipo === "check") {
    return (
      <label className={`adm-check${c.largura === 3 ? " largo" : ""}`}>
        <input type="checkbox" checked={!!valor} onChange={(e) => mudar(e.target.checked)} />
        <span>{c.rotulo}{c.dica && <small>{c.dica}</small>}</span>
      </label>
    );
  }
  if (c.tipo === "permissoes") {
    const marcadas: string[] = Array.isArray(valor) ? valor : [];
    const alternar = (v: string) => mudar(marcadas.includes(v) ? marcadas.filter((x) => x !== v) : [...marcadas, v]);
    return (
      <fieldset className="campo largo" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ marginBottom: 10 }}>{c.rotulo}</legend>
        <div className="adm-checks">
          {opcoes.map((o) => (
            <label key={o.valor} className="adm-check"><input type="checkbox" checked={marcadas.includes(o.valor)} onChange={() => alternar(o.valor)} /> <span>{o.rotulo}</span></label>
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <div className={classe}>
      <label htmlFor={id}>{c.rotulo}{c.obrigatorio && " *"}</label>
      {(c.tipo === "textarea" || c.tipo === "linhas") && <textarea id={id} value={valor} onChange={(e) => mudar(e.target.value)} placeholder={c.placeholder} />}
      {c.tipo === "markdown" && <CampoMarkdown id={id} valor={valor} mudar={mudar} />}
      {c.tipo === "imagem" && <CampoImagem valor={valor} mudar={mudar} />}
      {c.tipo === "select" && (
        <select id={id} value={valor} onChange={(e) => mudar(e.target.value)}>
          <option value="">— selecione —</option>
          {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
        </select>
      )}
      {c.tipo === "cor" && (
        <div className="adm-cor">
          <input type="color" value={HEX.test(valor) ? valor : c.placeholder || "#075fd7"} onChange={(e) => mudar(e.target.value)} aria-label={c.rotulo} />
          <input id={id} type="text" value={valor} onChange={(e) => mudar(e.target.value)} placeholder={c.placeholder} />
        </div>
      )}
      {c.tipo === "data" && <input id={id} inputMode="numeric" value={valor} onChange={(e) => mudar(mascaraData(e.target.value))} placeholder="dd/mm/aaaa" />}
      {c.tipo === "dataiso" && <input id={id} type="date" value={valor} onChange={(e) => mudar(e.target.value)} />}
      {c.tipo === "datahora" && <input id={id} type="datetime-local" value={valor} onChange={(e) => mudar(e.target.value)} />}
      {c.tipo === "numero" && <input id={id} type="number" value={valor ?? ""} onChange={(e) => mudar(e.target.value)} />}
      {c.tipo === "senha" && <input id={id} type="password" autoComplete="new-password" value={valor} onChange={(e) => mudar(e.target.value)} />}
      {(c.tipo === "texto" || c.tipo === "lista" || c.tipo === "email") && (
        <input id={id} type={c.tipo === "email" ? "email" : "text"} value={valor} onChange={(e) => mudar(e.target.value)} placeholder={c.placeholder} />
      )}
      {c.dica && c.tipo !== "markdown" && <small>{c.dica}</small>}
    </div>
  );
}
