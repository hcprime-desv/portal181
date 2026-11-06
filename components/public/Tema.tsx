"use client";

// Tema claro/escuro do site (igual ao site padrão p2pcorp) — configurado em
// /admin → Configuração do site ("Tema do site": claro, escuro ou
// automático = segue o aparelho) e, com "Mostrar botão claro/escuro", o
// visitante troca no topo (a escolha fica no navegador dele, em
// localStorage). O tema vai em <html data-tema="...">; as cores do escuro
// estão no fim do app/globals.css.
import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useConfiguracao } from "./AoVivo";
import { CHAVE_TEMA as CHAVE, botaoTemaDe, temaDe } from "@/lib/tema";
import type { TemaSite } from "@/types/conteudo";

type Efetivo = "claro" | "escuro";

function ler(): string | null { try { return localStorage.getItem(CHAVE); } catch { return null; } }
function gravar(v: Efetivo) { try { localStorage.setItem(CHAVE, v); } catch { /* navegador sem storage */ } }

function calcular(tema: TemaSite, botao: boolean): Efetivo {
  const escolhido = botao ? ler() : null;
  if (escolhido === "claro" || escolhido === "escuro") return escolhido;
  if (tema === "automatico") return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  return tema;
}

export function useTema() {
  const c = useConfiguracao();
  const tema = temaDe(c.tema);
  const botao = botaoTemaDe(c.temaBotao);
  const [atual, setAtual] = useState<Efetivo>("claro");
  useEffect(() => {
    const aplicar = () => { const t = calcular(tema, botao); document.documentElement.setAttribute("data-tema", t); setAtual(t); };
    aplicar();
    if (tema !== "automatico") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, [tema, botao]);
  const alternar = useCallback(() => {
    const t: Efetivo = atual === "escuro" ? "claro" : "escuro";
    gravar(t);
    document.documentElement.setAttribute("data-tema", t);
    setAtual(t);
  }, [atual]);
  return { escuro: atual === "escuro", alternar, botao };
}

// Botão do topo (sol/lua), no mesmo estilo da busca (.busca).
export function BotaoTema({ sempre = false }: { sempre?: boolean }) {
  const { escuro, alternar, botao } = useTema();
  if (!botao && !sempre) return null;
  return (
    <button type="button" className="busca botao-tema" onClick={alternar} aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"} title={escuro ? "Tema claro" : "Tema escuro"}>
      {escuro ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
