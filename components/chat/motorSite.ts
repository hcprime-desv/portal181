// CÓPIA gerada por scripts/copiar-chat-site.py — NÃO edite aqui: altere em packages/components/src/omnichannel e copie de novo.
// Padrão core360 (@hc/components/omnichannel/chatSite/motorSite) — 10/11/2026. FONTE ÚNICA: os sites recebem uma CÓPIA
// (python scripts/copiar-chat-site.py <site>) — sites não usam @hc/*. Só depende de firebase/firestore.
//
// CHAT DO SITE NO MESMO MOTOR DO WHATSAPP (canal SITE do back-end — back-end/core360/src/services/omnichannel/canalSite.ts):
// o site NÃO decide o fluxo. Cada mensagem do visitante vai para dados/{tenant do chat}/site_entrada (formato do webhook do
// WhatsApp) e o back-end responde em site_saida (formato da API do WhatsApp). Mesmo chatbot, blocos, fila e atendente.
import { addDoc, collection, onSnapshot, query, where, type Firestore, type Unsubscribe } from "firebase/firestore";

export type EntradaChat = {
  type: "text" | "interactive" | "location" | "image" | "video" | "audio" | "document";
  body?: string; title?: string; type_interactive?: "button_reply" | "list_reply" | "nfm_reply";
  latitude?: number; longitude?: number; file?: string; mime_type?: string; nome_file?: string; caption?: string;
};
export type ItemChat = { id: string; de: "eu" | "motor"; em: number; entrada?: EntradaChat; mensagem?: any };
export type MotorSite = {
  obterContato: () => string;
  enviar: (contato: string, e: EntradaChat) => Promise<void>;
  enviarArquivo: (contato: string, arquivo: File) => Promise<void>;
  escutar: (contato: string, cb: (itens: ItemChat[]) => void) => Unsubscribe;
};

/**
 * Motor do chat do site.
 *   db           Firestore do site
 *   tenant       onde roda o chatbot — caminho COMPLETO ("dados/DD360", "sites/p2pcorp"); sem barra = dados/<nome>
 *                (ex.: "DD360" no Portal 181) — o back-end desse tenant (mesmo _PATH) atende o chat
 *   upload       sobe um arquivo e devolve o link público (Storage do site)
 *   garantirSessao  sessão anônima do Firebase Auth, se o site usa (opcional)
 *   chaveLocal   chave do navegador onde fica o contato do visitante ("00" + 13 dígitos — nunca é telefone, sem dado pessoal)
 */
export function criarMotorSite(p: { db: Firestore; tenant: string; upload: (f: File) => Promise<string>; garantirSessao?: () => Promise<unknown>; chaveLocal?: string }): MotorSite {
  const base = p.tenant.includes("/") ? p.tenant.replace(/^\/+|\/+$/g, "") : `dados/${p.tenant}`;
  const col = (c: string) => collection(p.db, `${base}/${c}`);
  const chave = p.chaveLocal || "chat_site_contato";
  const sessao = async () => { try { await p.garantirSessao?.(); } catch { /* sem sessão: segue */ } };

  const obterContato = () => {
    const novo = () => "00" + String(Date.now()).slice(-10) + String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    if (typeof window === "undefined") return novo();
    try {
      let id = window.localStorage.getItem(chave);
      if (!id || !/^00\d{13}$/.test(id)) { id = novo(); window.localStorage.setItem(chave, id); }
      return id;
    } catch { return novo(); }
  };

  const enviar = async (contato: string, e: EntradaChat) => {
    await sessao();
    await addDoc(col("site_entrada"), { author: contato, senderName: "Visitante do site", ...e, processado: false, criado_em: Date.now() });
  };

  const enviarArquivo = async (contato: string, arquivo: File) => {
    const url = await p.upload(arquivo);
    const mime = arquivo.type || "application/octet-stream";
    const tipo = mime.startsWith("image") ? "image" : mime.startsWith("video") ? "video" : mime.startsWith("audio") ? "audio" : "document";
    await enviar(contato, { type: tipo, file: url, mime_type: mime, nome_file: arquivo.name, body: arquivo.name });
  };

  const escutar = (contato: string, cb: (itens: ItemChat[]) => void): Unsubscribe => {
    let enviados: ItemChat[] = [], recebidos: ItemChat[] = [];
    const juntar = () => cb([...enviados, ...recebidos].sort((a, b) => a.em - b.em));
    const p1 = onSnapshot(query(col("site_entrada"), where("author", "==", contato)), (s) => {
      enviados = s.docs.map((d) => { const x: any = d.data(); return { id: d.id, de: "eu" as const, em: Number(x.criado_em) || 0, entrada: x }; });
      juntar();
    }, (e) => console.warn("chat (entrada):", e?.message));
    const p2 = onSnapshot(query(col("site_saida"), where("contato", "==", contato)), (s) => {
      recebidos = s.docs.map((d) => { const x: any = d.data(); return { id: d.id, de: "motor" as const, em: Number(x.criado_em) || 0, mensagem: x.mensagem }; });
      juntar();
    }, (e) => console.warn("chat (saída):", e?.message));
    return () => { p1(); p2(); };
  };

  return { obterContato, enviar, enviarArquivo, escutar };
}
