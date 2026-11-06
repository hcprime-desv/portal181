"use client";

// /admin → Configuração do site (doc único dados/{tenant}/configuracoes/geral):
// nome, contato, logo, banner, cores, tema e os itens do menu. O site muda
// ao vivo ao salvar (AoVivoProvider).
import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { getDocOnce, salvarAlteracao } from "@/lib/firebase/gen";
import { PERMISSOES, registrarAuditoria } from "@/lib/admin/sessao";
import { CAMPOS_CONFIGURACAO, MENU_SITE } from "@/lib/admin/cadastros";
import { CampoForm, validar, valoresIniciais } from "./Campos";
import { renovarSite } from "@/app/admin/acoes";
import { Protegido, useAdmin, useTituloAdmin } from "./AdminShell";

const TODOS = [...CAMPOS_CONFIGURACAO, ...MENU_SITE];

function Formulario() {
  const { sessao, avisar } = useAdmin();
  const [original, setOriginal] = useState<Record<string, any> | null | undefined>(undefined);
  const [v, setV] = useState<Record<string, any>>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    getDocOnce("configuracoes", "geral")
      .then((doc) => { setOriginal(doc); setV(valoresIniciais(TODOS, doc)); })
      .catch(() => { setOriginal(null); setV(valoresIniciais(TODOS, null)); });
  }, []);

  const mudar = (nome: string) => (x: any) => setV((o) => ({ ...o, [nome]: x }));
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const dados = validar(TODOS, v);
    if (typeof dados === "string") return setErro(dados);
    setSalvando(true);
    try {
      await salvarAlteracao("configuracoes", "geral", dados);
      registrarAuditoria(sessao, { colecao: "configuracoes", id_registro: "geral", acao: "alteracao", descricao: "Configuração do site alterada no /admin", dados_anteriores: original, dados_novos: dados });
      setOriginal({ ...(original ?? {}), ...dados });
      avisar("Configuração salva. O site já mostra as mudanças.");
      renovarSite().catch(() => {});
    } catch {
      setErro("Não foi possível salvar. Confira a conexão e tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  if (original === undefined) return <div className="card adm-vazio">Carregando...</div>;
  return (
    <form className="adm-form" onSubmit={salvar} style={{ display: "grid", gap: 18 }}>
      <div className="card">
        <div className="adm-titulo-form"><h2>Identidade, contato e aparência</h2></div>
        <div className="grade-form">
          {CAMPOS_CONFIGURACAO.map((c) => <CampoForm key={c.nome} campo={c} valor={v[c.nome]} mudar={mudar(c.nome)} />)}
        </div>
      </div>
      <div className="card">
        <div className="adm-titulo-form"><h2>Itens do menu do site</h2></div>
        <p className="texto-mut" style={{ marginTop: -8 }}>Desmarque para esconder do menu (e da Home) o que este órgão não usa.</p>
        <div className="adm-checks">
          {MENU_SITE.map((c) => <CampoForm key={c.nome} campo={c} valor={v[c.nome]} mudar={mudar(c.nome)} />)}
        </div>
      </div>
      {erro && <div className="chat-erro" role="alert">{erro}</div>}
      <div className="acoes-form" style={{ marginTop: 0 }}>
        <button type="submit" className="btn btn-primary" disabled={salvando}><Save size={16} /> {salvando ? "Salvando..." : "Salvar configuração"}</button>
      </div>
    </form>
  );
}

export default function Configuracao() {
  useTituloAdmin("Configuração do site");
  return <Protegido permissao={PERMISSOES.configuracao}><Formulario /></Protegido>;
}
