"use client";
// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/layout/src/sites/admin e copie de novo.

// /admin dos SITES — Trocar senha (o próprio usuário; confere a atual). Rota /admin/senha.
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { trocarSenha } from "@/lib/admin/sessao";
import { useAdmin, useTituloAdmin } from "./AdminShell";

export default function TrocarSenha() {
  useTituloAdmin("Trocar senha");
  const { sessao, avisar } = useAdmin();
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (nova !== confirma) return setErro("A confirmação não confere com a nova senha.");
    if (!sessao) return;
    setSalvando(true);
    try {
      const problema = await trocarSenha(sessao, atual, nova);
      if (problema) return setErro(problema);
      setAtual(""); setNova(""); setConfirma("");
      avisar("Senha trocada.");
    } catch {
      setErro("Não foi possível trocar a senha. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  };
  return (
    <form className="card adm-form" onSubmit={salvar} style={{ maxWidth: 520 }}>
      <div className="adm-titulo-form"><h2>Trocar a minha senha</h2></div>
      <div className="grade-form" style={{ gridTemplateColumns: "1fr" }}>
        <div className="campo"><label htmlFor="s-atual">Senha atual</label><input id="s-atual" type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} /></div>
        <div className="campo"><label htmlFor="s-nova">Nova senha</label><input id="s-nova" type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} /><small>Pelo menos 6 caracteres, com letra maiúscula, minúscula, número e símbolo.</small></div>
        <div className="campo"><label htmlFor="s-conf">Confirme a nova senha</label><input id="s-conf" type="password" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} /></div>
      </div>
      {erro && <div className="chat-erro" role="alert" style={{ marginTop: 16 }}>{erro}</div>}
      <div className="acoes-form"><button type="submit" className="btn btn-primary" disabled={salvando}><KeyRound size={16} /> {salvando ? "Salvando..." : "Trocar senha"}</button></div>
    </form>
  );
}
