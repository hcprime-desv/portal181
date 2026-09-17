// Identidade anônima do visitante do site — mesmo espírito de anonimato do
// resto do Portal181 (ninguém precisa se identificar pra denunciar, e
// aqui também não pra conversar no chat). Um id aleatório persistido no
// navegador (localStorage) identifica a MESMA pessoa entre recarregamentos
// da página, sem nenhum dado pessoal.
const CHAVE_ID = "portal181_visitante_id";

function gerarId(): string {
  return "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function obterVisitanteId(): string {
  if (typeof window === "undefined") return gerarId();
  try {
    let id = window.localStorage.getItem(CHAVE_ID);
    if (!id) {
      id = gerarId();
      window.localStorage.setItem(CHAVE_ID, id);
    }
    return id;
  } catch {
    // Storage bloqueado (aba anônima/privacidade restrita) — funciona
    // igual, só não persiste entre reloads.
    return gerarId();
  }
}
