// Camada de dados client-side, no mesmo padrão do `shared/gen/gen.ts` do
// hcCore (getAll com onSnapshot, addKey via transação pra IDs
// sequenciais) — faz sentido reusar esse padrão aqui porque agora as duas
// aplicações leem/escrevem do mesmo jeito: direto do navegador, sem
// servidor no meio (ver next.config.js: output "export").
//
// Diferente do hcCore (onde `path` vem do login e pode mudar por
// cliente), aqui o tenant é fixo por implantação: `NEXT_PUBLIC_PORTAL181_PATH`
// (env, ex: "DDBA" — case-sensitive, confira o `path` real do cliente
// Portal181 na coleção `cliente` do hcCore).
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./client";

const TENANT_PATH = process.env.NEXT_PUBLIC_PORTAL181_PATH;

function tenantColRef(colecao: string) {
  if (!TENANT_PATH) {
    throw new Error(
      "NEXT_PUBLIC_PORTAL181_PATH não configurado — defina no .env.local (ou nas env vars do deploy) qual é o tenant deste site antes de ler/gravar no Firestore.",
    );
  }
  return collection(db, `dados/${TENANT_PATH}/${colecao}`);
}

// Listener em tempo real de uma coleção inteira — mesmo formato do
// `getAll` do hcCore.
export function getAll(colecao: string, callback: (docs: any[]) => void): Unsubscribe {
  return onSnapshot(tenantColRef(colecao), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Leitura pontual (sem listener) — usada quando não precisa ficar
// "escutando" mudanças, só ler uma vez (ex: páginas de conteúdo público).
export async function getAllOnce(colecao: string): Promise<any[]> {
  const snap = await getDocs(tenantColRef(colecao));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getDocOnce(colecao: string, id: string): Promise<any | null> {
  const snap = await getDoc(doc(tenantColRef(colecao), id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Listener em tempo real de um único doc — usado por quem já tem o id em
// mãos (ex: acompanhamento de denúncia por protocolo) e quer ver mudanças
// de status feitas na apuração operacional sem precisar recarregar.
export function getDocOn(colecao: string, id: string, callback: (doc: any | null) => void): Unsubscribe {
  return onSnapshot(doc(tenantColRef(colecao), id), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// Contador sequencial por coleção — mesma mecânica do `addKey` do hcCore
// (transação sobre dados/{tenant}/incrementKey/{tabela}), mas o Portal181
// usa isso só indiretamente: o protocolo de denúncia tem formato próprio
// (181-AAAA-NNNNNNNN, ver lib/protocolo.ts), então o número sequencial
// sai daqui e o formato final é montado por cima.
export async function addKey(tabela: string): Promise<number> {
  if (!TENANT_PATH) throw new Error("NEXT_PUBLIC_PORTAL181_PATH não configurado.");
  const counterRef = doc(db, `dados/${TENANT_PATH}/incrementKey`, tabela);
  return runTransaction(db, async (t) => {
    const snap = await t.get(counterRef);
    const atual = (snap.data()?.countKey as number | undefined) ?? 0;
    const proximo = atual + 1;
    t.set(counterRef, { countKey: proximo }, { merge: true });
    return proximo;
  });
}

export async function criarDocComId(colecao: string, id: string, data: any): Promise<void> {
  await setDoc(doc(tenantColRef(colecao), id), data);
}

// Cria com ID automático do Firestore (addDoc) — diferente de
// `criarDocComId`, usado quando não precisa de um ID previsível (ex:
// mensagens de chat, onde cada uma já é referenciada só pelo campo
// `idChat`, não pelo próprio id do doc).
export async function criarDoc(colecao: string, data: any): Promise<string> {
  const ref = await addDoc(tenantColRef(colecao), data);
  return ref.id;
}

export async function atualizarDoc(colecao: string, id: string, data: any): Promise<void> {
  await updateDoc(doc(tenantColRef(colecao), id), data);
}

// Incrementa um ou mais campos numéricos de um doc, criando-o com `merge`
// se ainda não existir (sem precisar de leitura antes) — usado pelos
// contadores de audiência (lib/audiencia.ts): cada acesso/evento só
// incrementa um campo no "balde" da hora atual, nunca cria um documento
// por evento. `increment()` é uma operação atômica no servidor do
// Firestore, então concorrência entre vários visitantes ao mesmo tempo
// não perde incremento nenhum (diferente de ler o valor e gravar +1).
export async function incrementarCampos(
  colecao: string,
  id: string,
  campos: Record<string, number>,
  extras: Record<string, any> = {},
): Promise<void> {
  const dados: Record<string, any> = { ...extras };
  for (const [campo, valor] of Object.entries(campos)) {
    dados[campo] = increment(valor);
  }
  await setDoc(doc(tenantColRef(colecao), id), dados, { merge: true });
}

// Listener em tempo real com um filtro + ordenação — usado pra mensagens
// de chat (filtra por `idChat`, ordena por `created_at`), mesmo padrão do
// `getFilterOn` do hcCore.
export function getFilterOn(
  colecao: string,
  campo: string,
  valor: any,
  ordenarPor: string,
  callback: (docs: any[]) => void,
): Unsubscribe {
  const q = query(tenantColRef(colecao), where(campo, "==", valor), orderBy(ordenarPor));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Upload pro Firebase Storage, mesmo padrão do `uploadFile` do hcCore
// (shared/gen/gen.ts) — sobe em `uploads/{nome do arquivo}` e retorna a
// URL pública. Usado pelos anexos da denúncia (lib/denunciaClient.ts).
export async function uploadFile(file: File): Promise<string> {
  const nome = file.name || `arquivo-${Date.now()}`;
  const storageRef = ref(storage, `uploads/${Date.now()}-${nome}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
