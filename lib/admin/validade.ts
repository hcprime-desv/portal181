// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/nucleo/src/compartilhado/validade.ts e copie de novo.
// VALIDADE DO USUÁRIO (dono, 11/11/2026 — vale para TODO o ecossistema: painéis, /admin dos sites, apps mobile):
// todo usuário tem um TEMPO DE PERMANÊNCIA — perpétuo ou por horas, dias, semanas ou meses — e EXPIRA ao fim dele
// (acesso de teste, consultoria, demonstração). TS puro, sem dependência (o site e o app levam uma cópia).
//
// Campos em `usuarios`:
//   permanencia      "perpetua" | "horas" | "dias" | "semanas" | "meses"  (sem o campo = perpétua: cadastros antigos)
//   permanencia_qtd  quantidade (ex.: 7 dias)
//   expira_em        milissegundos (Date.now()) ou null (perpétua)
// O login recusa usuário vencido (`problemaValidade`) e a sessão aberta é derrubada ao revalidar.
// Ao salvar, `planejarValidade`: a validade conta A PARTIR DE AGORA quando é nova, quando mudou o tipo/quantidade ou
// quando o usuário já tinha vencido (salvar de novo = renovar); senão mantém a data já gravada.

export const PERMANENCIAS = ["perpetua", "horas", "dias", "semanas", "meses"] as const;
export type Permanencia = (typeof PERMANENCIAS)[number];
export const ROTULOS_PERMANENCIA: Record<Permanencia, string> = {
  perpetua: "Perpétua (não expira)", horas: "Horas", dias: "Dias", semanas: "Semanas", meses: "Meses",
};

const HORA = 3600 * 1000;
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const t = v as any;
  if (typeof t?.toMillis === "function") return t.toMillis();
  if (typeof t?.seconds === "number") return t.seconds * 1000;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
export const permanenciaDe = (v: unknown): Permanencia => ((PERMANENCIAS as readonly string[]).includes(String(v)) ? (v as Permanencia) : "perpetua");

/** Data em que a validade termina, contando de `inicio`. Perpétua = null. Meses = meses do calendário. */
export function calcularExpiracao(tipo: unknown, qtd: unknown, inicio = Date.now()): number | null {
  const t = permanenciaDe(tipo);
  const q = Math.floor(Number(qtd));
  if (t === "perpetua") return null;
  if (!Number.isFinite(q) || q < 1) throw new Error("Informe por quanto tempo o usuário fica ativo (1 ou mais).");
  if (t === "horas") return inicio + q * HORA;
  if (t === "dias") return inicio + q * 24 * HORA;
  if (t === "semanas") return inicio + q * 7 * 24 * HORA;
  const d = new Date(inicio);
  d.setMonth(d.getMonth() + q);
  return d.getTime();
}

/** Venceu? (sem `expira_em` = perpétuo, nunca vence) */
export function usuarioExpirado(u: Record<string, any> | null | undefined, agora = Date.now()): boolean {
  const e = num(u?.expira_em);
  return e !== null && e <= agora;
}

const dataHora = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} às ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** Mensagem do login (ou null quando está dentro da validade). */
export function problemaValidade(u: Record<string, any> | null | undefined, agora = Date.now()): string | null {
  if (!usuarioExpirado(u, agora)) return null;
  return `O acesso deste usuário expirou em ${dataHora(num(u!.expira_em)!)}. Peça ao administrador para renovar.`;
}

/** Texto curto para listas e fichas: "Perpétua", "Até 18/11/2026 às 10:00", "Expirou em ...". */
export function textoValidade(u: Record<string, any> | null | undefined, agora = Date.now()): string {
  const e = num(u?.expira_em);
  if (e === null) return "Perpétua";
  return e <= agora ? `Expirou em ${dataHora(e)}` : `Até ${dataHora(e)}`;
}

/** Campos de validade a gravar no usuário (ver regra no topo). Lança erro com a mensagem do formulário. */
export function planejarValidade(
  atual: Record<string, any> | null | undefined,
  novo: { permanencia: unknown; permanencia_qtd: unknown },
  agora = Date.now(),
): { permanencia: Permanencia; permanencia_qtd: number | null; expira_em: number | null } {
  const tipo = permanenciaDe(novo.permanencia);
  if (tipo === "perpetua") return { permanencia: "perpetua", permanencia_qtd: null, expira_em: null };
  const qtd = Math.floor(Number(novo.permanencia_qtd));
  const mudou = !atual || permanenciaDe(atual.permanencia) !== tipo || Number(atual.permanencia_qtd) !== qtd || num(atual.expira_em) === null;
  const expira = mudou || usuarioExpirado(atual, agora) ? calcularExpiracao(tipo, qtd, agora) : num(atual!.expira_em);
  return { permanencia: tipo, permanencia_qtd: qtd, expira_em: expira };
}
