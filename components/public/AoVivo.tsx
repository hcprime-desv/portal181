"use client";

// Configuração do site AO VIVO (padrão do site p2pcorp): o servidor entrega
// a configuração atual e, no navegador, o onSnapshot acompanha o que o
// /admin salvar (cores, tema, logo, textos, itens do menu) sem recarregar.
// O wrapper `.tema` leva as cores da configuração para as variáveis do CSS.
import { createContext, useContext, useEffect, useState } from "react";
import { subscribeConfiguracao } from "@/lib/data";
import { coresDoTema } from "@/lib/tema";
import type { Configuracao } from "@/types/conteudo";

const Ctx = createContext<Configuracao>({});

export function AoVivoProvider({ inicial, children }: { inicial: Configuracao; children: React.ReactNode }) {
  const [c, setC] = useState<Configuracao>(inicial);
  useEffect(() => subscribeConfiguracao(setC), []);
  return (
    <Ctx.Provider value={c}>
      <div className="tema" style={coresDoTema(c)}>{children}</div>
    </Ctx.Provider>
  );
}

export const useConfiguracao = () => useContext(Ctx);

// Nome do órgão com o padrão do produto.
export const nomeDoSite = (c: Configuracao) => c.nomeOrgao || "Portal 181 — Disque Denúncia";
