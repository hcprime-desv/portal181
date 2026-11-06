// Tema claro/escuro (servidor e navegador) — igual ao site padrão (p2pcorp).
// Ver components/public/Tema.tsx.
import type { CSSProperties } from "react";
import type { TemaSite } from "@/types/conteudo";

export const CHAVE_TEMA = "tema-site"; // escolha do visitante (localStorage)

// Sem configuração: segue o aparelho, com o botão sol/lua no topo.
export const temaDe = (t?: string): TemaSite => (t === "claro" || t === "escuro" ? t : "automatico");
export const botaoTemaDe = (b?: boolean) => b !== false;

// Script do <head> (app/layout.tsx): aplica o tema ANTES de pintar a página,
// para não piscar claro antes de escurecer.
export function scriptTema(tema: TemaSite, botao: boolean): string {
  return `(function(){try{var t=${JSON.stringify(tema)},e=${botao ? `localStorage.getItem(${JSON.stringify(CHAVE_TEMA)})` : "null"};`
    + `if(e!=="claro"&&e!=="escuro")e=t==="automatico"?(matchMedia("(prefers-color-scheme: dark)").matches?"escuro":"claro"):t;`
    + `document.documentElement.setAttribute("data-tema",e)}catch(_){}})();`;
}

const HEX = /^#[0-9A-Fa-f]{6}$/;
const hex = (v?: string) => (v && HEX.test(v) ? v : undefined);

// Cores da Configuração → variáveis do CSS padrão (--cor, --destaque,
// --escura viram --blue, --green e --navy no .tema do globals.css).
export function coresDoTema(c: { corPrimaria?: string; corSecundaria?: string; corDestaque?: string }): CSSProperties {
  const v: Record<string, string> = {};
  if (hex(c.corSecundaria)) v["--cor"] = c.corSecundaria!;
  if (hex(c.corDestaque)) v["--destaque"] = c.corDestaque!;
  if (hex(c.corPrimaria)) v["--escura"] = c.corPrimaria!;
  return v as CSSProperties;
}
