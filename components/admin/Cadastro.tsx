"use client";

// Cadastro genérico do /admin (lista + busca + formulário + exclusão) para
// qualquer entrada de lib/admin/cadastros.ts. Lista ao vivo (onSnapshot),
// grava com id sequencial (mesmo contador dos painéis) e deixa a trilha em
// logs_auditoria.
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { excluirDoc, getAll, salvarAlteracao, salvarNovo } from "@/lib/firebase/gen";
import { registrarAuditoria } from "@/lib/admin/sessao";
import { renovarSite } from "@/app/admin/acoes";
import { cadastroPorId, type Cadastro as Def, type Coluna } from "@/lib/admin/cadastros";
import { CampoForm, useOpcoes, validar, valoresIniciais } from "./Campos";
import { Protegido, useAdmin, useTituloAdmin } from "./AdminShell";

const texto = (v: any) => (v === undefined || v === null || v === "" ? "—" : String(v));

function CelulaRef({ def, coluna, valor }: { def: Def; coluna: Coluna; valor: any }) {
  const campo = def.campos.find((c) => c.nome === coluna.campo)!;
  const opcoes = useOpcoes(campo);
  return <>{opcoes.find((o) => o.valor === String(valor))?.rotulo ?? texto(valor)}</>;
}

function Celula({ def, coluna, r }: { def: Def; coluna: Coluna; r: any }) {
  const v = r[coluna.campo];
  switch (coluna.tipo) {
    case "imagem":
      // eslint-disable-next-line @next/next/no-img-element
      return v ? <img className="mini" src={v} alt="" /> : <span className="texto-mut">—</span>;
    case "check":
      return <span className={`selo${v === false ? " off" : ""}`}>{v === false ? "Oculto" : "Sim"}</span>;
    case "lista":
      return <>{Array.isArray(v) ? (v.length > 3 ? `${v.length} itens` : v.join(", ")) : texto(v)}</>;
    case "ref":
      return <CelulaRef def={def} coluna={coluna} valor={v} />;
    case "selo": {
      if (coluna.campo === "urgente") return <span className={`selo${v ? " alerta" : " off"}`}>{v ? "Pop-up (urgente)" : "Banner"}</span>;
      const ok = ["Publicado", "ativo", "Ativo"].includes(v);
      return <span className={`selo${ok ? "" : v === "bloqueado" ? " alerta" : " off"}`}>{texto(v)}</span>;
    }
    default:
      return <>{texto(v)}</>;
  }
}

function Formulario({ def, registro, fechar }: { def: Def; registro: any | null; fechar: () => void }) {
  const { sessao, avisar } = useAdmin();
  const [v, setV] = useState(() => valoresIniciais(def.campos, registro));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    let dados = validar(def.campos, v);
    if (typeof dados === "string") return setErro(dados);
    setSalvando(true);
    try {
      if (def.preparar) {
        const r = await def.preparar(dados, registro);
        if (typeof r === "string") return setErro(r);
        dados = r;
      }
      const nome = String(dados[def.rotulo] ?? "");
      if (registro) {
        await salvarAlteracao(def.colecao, String(registro.id), dados);
        registrarAuditoria(sessao, { colecao: def.colecao, id_registro: registro.id, acao: "alteracao", descricao: `${def.singular} "${nome}" alterado(a) no /admin`, dados_anteriores: registro, dados_novos: dados });
        avisar("Registro atualizado.");
      } else {
        const id = await salvarNovo(def.colecao, dados);
        registrarAuditoria(sessao, { colecao: def.colecao, id_registro: id, acao: "criacao", descricao: `${def.singular} "${nome}" incluído(a) no /admin`, dados_novos: dados });
        avisar("Registro incluído.");
      }
      renovarSite().catch(() => {});
      fechar();
    } catch (err) {
      console.error(err);
      setErro("Não foi possível salvar. Confira a conexão e tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form className="card adm-form" onSubmit={salvar}>
      <div className="adm-titulo-form">
        <h2>{registro ? `Editar ${def.singular}` : `Novo(a) ${def.singular}`}</h2>
        <button type="button" className="btn btn-outline" onClick={fechar}><ArrowLeft size={16} /> Voltar</button>
      </div>
      <div className="grade-form">
        {def.campos.map((c) => <CampoForm key={c.nome} campo={c} valor={v[c.nome]} mudar={(x) => setV((o) => ({ ...o, [c.nome]: x }))} />)}
      </div>
      {erro && <div className="chat-erro" role="alert" style={{ marginTop: 16 }}>{erro}</div>}
      <div className="acoes-form">
        <button type="button" className="btn btn-outline" onClick={fechar}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={salvando}><Save size={16} /> {salvando ? "Salvando..." : "Salvar"}</button>
      </div>
    </form>
  );
}

function Lista({ def }: { def: Def }) {
  const { sessao, avisar } = useAdmin();
  const [dados, setDados] = useState<any[] | null>(null);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<any | null | "novo">(null);
  const [excluir, setExcluir] = useState<any | null>(null);

  useEffect(() => {
    setDados(null); setEditando(null); setBusca("");
    try {
      return getAll(def.colecao, (docs) => setDados(docs));
    } catch {
      setDados([]);
      avisar("Banco não configurado (NEXT_PUBLIC_SITE_PATH).", true);
    }
  }, [def.colecao, avisar]);

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const lista = [...(dados ?? [])].sort(def.ordenar ?? ((a, b) => Number(b.id) - Number(a.id)));
    if (!q) return lista;
    return lista.filter((r) => def.colunas.some((c) => String(r[c.campo] ?? "").toLowerCase().includes(q)) || String(r.id) === q);
  }, [dados, busca, def]);

  const confirmarExclusao = async () => {
    const r = excluir;
    setExcluir(null);
    if (!r) return;
    if (def.colecao === "usuarios" && String(r.id) === sessao?.id) return avisar("Você não pode excluir o seu próprio usuário.", true);
    try {
      await excluirDoc(def.colecao, String(r.id));
      registrarAuditoria(sessao, { colecao: def.colecao, id_registro: r.id, acao: "exclusao", descricao: `${def.singular} "${r[def.rotulo] ?? r.id}" excluído(a) no /admin`, dados_anteriores: r });
      avisar("Registro excluído.");
      renovarSite().catch(() => {});
    } catch {
      avisar("Não foi possível excluir.", true);
    }
  };

  if (editando) return <Formulario def={def} registro={editando === "novo" ? null : editando} fechar={() => setEditando(null)} />;

  return (
    <>
      {def.descricao && <p className="texto-mut" style={{ margin: 0 }}>{def.descricao}</p>}
      <div className="adm-barra">
        <div className="busca-faq"><input type="search" placeholder={`Buscar em ${def.titulo.toLowerCase()}...`} value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar" /></div>
        <button type="button" className="btn btn-primary" onClick={() => setEditando("novo")}><Plus size={18} /> Novo(a) {def.singular}</button>
      </div>
      <div className="card adm-tabela-caixa" style={{ padding: 0 }}>
        {dados === null ? <div className="adm-vazio">Carregando...</div> : visiveis.length === 0 ? (
          <div className="adm-vazio">{busca ? "Nada encontrado com essa busca." : `Nenhum(a) ${def.singular} cadastrado(a) ainda.`}</div>
        ) : (
          <table className="adm-tabela">
            <thead><tr><th>#</th>{def.colunas.map((c) => <th key={c.campo}>{c.rotulo}</th>)}<th className="acoes">Ações</th></tr></thead>
            <tbody>
              {visiveis.map((r) => (
                <tr key={r.id}>
                  <td className="texto-mut">{r.id}</td>
                  {def.colunas.map((c) => <td key={c.campo}><Celula def={def} coluna={c} r={r} /></td>)}
                  <td className="acoes">
                    <button type="button" className="adm-icone-btn" onClick={() => setEditando(r)} aria-label="Editar" title="Editar"><Pencil size={16} /></button>
                    <button type="button" className="adm-icone-btn perigo" onClick={() => setExcluir(r)} aria-label="Excluir" title="Excluir"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {dados && <p className="texto-mut" style={{ margin: 0, fontSize: 13 }}>{visiveis.length} de {dados.length} registro(s).</p>}

      {excluir && (
        <div className="modal-fundo" role="dialog" aria-modal="true" onClick={() => setExcluir(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="corpo-m">
              <h2>Excluir {def.singular}?</h2>
              <p className="texto-mut">&ldquo;{excluir[def.rotulo] ?? excluir.id}&rdquo; sai do site na hora. Esta ação não pode ser desfeita.</p>
              <div className="acoes-form">
                <button type="button" className="btn btn-outline" onClick={() => setExcluir(null)}>Cancelar</button>
                <button type="button" className="btn btn-red" onClick={confirmarExclusao}><Trash2 size={16} /> Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Cadastro({ def }: { def: Def }) {
  useTituloAdmin(def.titulo);
  return <Protegido permissao={def.permissao}><Lista def={def} /></Protegido>;
}

// Usado pela rota /admin/[cadastro] (a definição tem funções: fica no cliente).
export function CadastroRota({ id }: { id: string }) {
  const def = cadastroPorId(id);
  return def ? <Cadastro def={def} /> : null;
}
