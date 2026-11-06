"use client";

// Relatórios do /admin (só leitura): conteúdo por coleção (total, visíveis,
// ocultos) e os Resultados por natureza da denúncia e por município.
import { PERMISSOES } from "@/lib/admin/sessao";
import { Protegido, useTituloAdmin } from "./AdminShell";
import { useColecoes } from "./Painel";

const COLECOES = [
  ["noticias", "Notícias"], ["procurados", "Procurados"], ["desaparecidos", "Desaparecidos"],
  ["recompensas", "Recompensas"], ["resultados", "Resultados"],
] as const;

function Barras({ titulo, itens }: { titulo: string; itens: [string, number][] }) {
  const max = Math.max(1, ...itens.map(([, n]) => n));
  return (
    <div className="card">
      <h3>{titulo}</h3>
      {itens.length === 0 ? <p className="texto-mut">Nenhum resultado cadastrado.</p> : (
        <div className="barras">
          {itens.map(([rotulo, n]) => (
            <div key={rotulo} className="barra-linha">
              <span>{rotulo}</span>
              <span className="barra-trilho"><span className="barra-cheia" style={{ display: "block", width: `${(n / max) * 100}%` }} /></span>
              <b>{n}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const contar = (lista: string[]) => {
  const m = new Map<string, number>();
  lista.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

function Conteudo() {
  const d = useColecoes([...COLECOES.map(([c]) => c), "natureza"]);
  const naturezas = new Map((d.natureza ?? []).map((n) => [String(n.id), String(n.nome ?? n.id)]));
  const resultados = d.resultados ?? [];
  return (
    <>
      <div className="card adm-tabela-caixa" style={{ padding: 0 }}>
        <table className="adm-tabela">
          <thead><tr><th>Conteúdo</th><th>Total</th><th>Visíveis no site</th><th>Ocultos</th></tr></thead>
          <tbody>
            {COLECOES.map(([c, rotulo]) => {
              const docs = d[c] ?? [];
              const vis = docs.filter((x) => x.ativo !== false).length;
              return <tr key={c}><td>{rotulo}</td><td>{docs.length}</td><td>{vis}</td><td>{docs.length - vis}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
      <div className="adm-duas">
        <Barras titulo="Resultados por natureza" itens={contar(resultados.map((r) => naturezas.get(String(r.id_natureza)) ?? "Sem natureza"))} />
        <Barras titulo="Resultados por município" itens={contar(resultados.map((r) => r.municipio || "Não informado"))} />
      </div>
    </>
  );
}

export default function Relatorios() {
  useTituloAdmin("Relatórios");
  return <Protegido permissao={PERMISSOES.relatorios}><Conteudo /></Protegido>;
}
