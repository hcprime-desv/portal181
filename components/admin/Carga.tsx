"use client";

// /admin → Carga de dados de teste: o mesmo exemplo do antigo painel
// (notícias, procurados, desaparecidos, recompensas, resultados, páginas,
// baralhos com cartas e avisos), tudo marcado `_cargaTeste: true` — o botão
// "Apagar dados de teste" tira só esses, nunca o conteúdo de verdade.
import { useState } from "react";
import { Play, Trash2 } from "lucide-react";
import { excluirDoc, getFilterOnce, salvarNovo } from "@/lib/firebase/gen";
import { PERMISSOES, registrarAuditoria } from "@/lib/admin/sessao";
import { Protegido, useAdmin, useTituloAdmin } from "./AdminShell";
import { renovarSite } from "@/app/admin/acoes";

const COLECOES = ["noticias", "procurados", "desaparecidos", "recompensas", "resultados", "paginas", "baralhos", "baralhoCartas", "avisos"];

const diasAtras = (n: number) => {
  const d = new Date(Date.now() - n * 86400_000);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

async function executarCarga(log: (m: string) => void) {
  const criar = (colecao: string, dados: Record<string, any>) => salvarNovo(colecao, { ...dados, _cargaTeste: true });
  const lote = async (colecao: string, rotulo: string, itens: Record<string, any>[]) => {
    for (const i of itens) await criar(colecao, i);
    log(`✅ ${itens.length} ${rotulo}`);
  };
  await lote("noticias", "notícias", [
    { titulo: "Operação resulta em prisões após denúncias ao 181 (teste)", resumo: "Ação conjunta prendeu 3 suspeitos.", data: diasAtras(2), ativo: true },
    { titulo: "Veículo roubado é recuperado com ajuda da população (teste)", resumo: "Denúncia anônima levou à recuperação.", data: diasAtras(5), ativo: true },
  ]);
  await lote("procurados", "procurados", [
    { nome: "Carlos Silva (teste)", motivo: "Homicídio", municipio: "Salvador", ativo: true },
    { nome: "Marcos Oliveira (teste)", motivo: "Tráfico de drogas", municipio: "Feira de Santana", ativo: true },
  ]);
  await lote("desaparecidos", "desaparecidos", [{ nome: "Ana Clara Souza (teste)", idade: 16, municipio: "Salvador", dataDesaparecimento: diasAtras(10), ativo: true }]);
  await lote("recompensas", "recompensas", [{ titulo: "Foragido por homicídio (teste)", descricao: "Informações que levem à captura.", valor: "Até R$ 50.000,00", ativo: true }]);
  await lote("resultados", "resultados", [{ titulo: "Apreensão de drogas no interior (teste)", descricao: "Ação resultou na apreensão de entorpecentes.", municipio: "Feira de Santana", data: diasAtras(3), ativo: true }]);
  await lote("paginas", "páginas", [
    { titulo: "Perguntas Frequentes (teste)", slug: "perguntas-frequentes-teste", conteudo: "Conteúdo de exemplo gerado pela carga de teste.", status: "Rascunho", local: "Rodapé" },
    { titulo: "Sobre o Programa (teste)", slug: "sobre-o-programa-teste", conteudo: "Conheça mais sobre o programa e como suas denúncias ajudam a combater a criminalidade.", status: "Publicado", local: "Menu", linkUrl: "/noticias", linkTexto: "Ver resultados" },
    { titulo: "Cartaz 2024 (teste)", slug: "cartaz-2024-teste", conteudo: "Material de divulgação do canal Disque Denúncia.", status: "Publicado", local: "Menu", submenu: "Material Divulgação (teste)" },
    { titulo: "Violência Contra Mulher (teste)", slug: "violencia-contra-mulher-teste", conteudo: "Material de divulgação sobre denúncias de violência contra a mulher.", status: "Publicado", local: "Menu", submenu: "Material Divulgação (teste)" },
  ]);
  const crime = await criar("baralhos", { slug: "baralho-do-crime-teste", nome: "Baralho do Crime (teste)", naipes: ["ouros", "espadas", "paus", "copas"], ativo: true, ordem: 1 });
  const lilas = await criar("baralhos", { slug: "baralho-lilas-teste", nome: "Baralho Lilás (teste)", naipes: ["ouros", "espadas", "paus", "copas"], ativo: true, ordem: 2 });
  log("✅ 2 baralhos");
  await lote("baralhoCartas", "cartas", [
    { baralhoId: crime, naipe: "espadas", valor: "A", nome: "Carlos Silva (teste)", descricao: "Homicídio" },
    { baralhoId: crime, naipe: "ouros", valor: "K", nome: "Marcos Oliveira (teste)", descricao: "Tráfico de drogas" },
    { baralhoId: crime, naipe: "paus", valor: "Q", nome: "João Pereira (teste)", descricao: "Roubo" },
    { baralhoId: crime, naipe: "copas", valor: "J", nome: "Antônio Souza (teste)", descricao: "Furto qualificado" },
    { baralhoId: lilas, naipe: "espadas", valor: "A", nome: "Suspeito de feminicídio (teste)", descricao: "Violência contra a mulher" },
    { baralhoId: lilas, naipe: "ouros", valor: "K", nome: "Suspeito de agressão (teste)", descricao: "Violência doméstica" },
  ]);
  await lote("avisos", "avisos (1 pop-up e 1 banner)", [
    { titulo: "Alerta: criança desaparecida (teste)", mensagem: "Ajude a localizar. Qualquer informação, **denuncie agora** pelo canal anônimo.", urgente: true, ativo: true, ordem: 1 },
    { titulo: "Nova recompensa disponível (teste)", mensagem: "Confira os casos com recompensa oficialmente divulgada.", linkUrl: "/recompensas", linkTexto: "Ver recompensas", urgente: false, ativo: true, ordem: 1 },
  ]);
}

async function apagarCarga(log: (m: string) => void) {
  for (const c of COLECOES) {
    const docs = await getFilterOnce(c, "_cargaTeste", true);
    for (const d of docs) await excluirDoc(c, String(d.id));
    if (docs.length) log(`🗑️ ${docs.length} de ${c}`);
  }
}

function Tela() {
  const { sessao, avisar } = useAdmin();
  const [rodando, setRodando] = useState<"" | "carga" | "apagar">("");
  const [logs, setLogs] = useState<string[]>([]);
  const log = (m: string) => setLogs((l) => [...l, m]);
  const rodar = async (tipo: "carga" | "apagar") => {
    if (tipo === "apagar" && !confirm("Apagar TODOS os registros marcados como teste? O conteúdo de verdade não é tocado.")) return;
    setRodando(tipo); setLogs([]);
    try {
      if (tipo === "carga") await executarCarga(log); else await apagarCarga(log);
      log(tipo === "carga" ? "🎉 Carga concluída." : "🎉 Dados de teste apagados.");
      registrarAuditoria(sessao, { colecao: "_cargaTeste", id_registro: "portal181", acao: "outro", descricao: tipo === "carga" ? "Carga de dados de teste executada" : "Dados de teste apagados" });
      avisar(tipo === "carga" ? "Carga de teste concluída." : "Dados de teste apagados.");
      renovarSite().catch(() => {});
    } catch (e) {
      console.error(e);
      log("❌ Falhou — veja o console do navegador.");
      avisar("A operação falhou.", true);
    } finally {
      setRodando("");
    }
  };
  return (
    <div className="card" style={{ maxWidth: 820 }}>
      <h3>Dados de exemplo para conhecer o site</h3>
      <p className="texto-mut">Cria notícias, procurados, desaparecidos, recompensas, resultados, páginas, dois baralhos com cartas e dois avisos, todos com “(teste)” no nome. Use só em ambiente de demonstração.</p>
      <div className="botoes" style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-primary" disabled={!!rodando} onClick={() => rodar("carga")}><Play size={16} /> {rodando === "carga" ? "Gravando..." : "Processar carga de teste"}</button>
        <button type="button" className="btn btn-outline" disabled={!!rodando} onClick={() => rodar("apagar")}><Trash2 size={16} /> {rodando === "apagar" ? "Apagando..." : "Apagar dados de teste"}</button>
      </div>
      {logs.length > 0 && <div className="adm-log">{logs.join("\n")}</div>}
    </div>
  );
}

export default function Carga() {
  useTituloAdmin("Carga de dados de teste");
  return <Protegido permissao={PERMISSOES.carga}><Tela /></Protegido>;
}
