// Camada de dados do site e do /admin, no mesmo padrão do `gen` dos painéis
// (@hc/nucleo/gen: getAll com onSnapshot, ids sequenciais pelo mesmo
// contador `incrementKey`) — o painel do Disque Denúncia (DD360) e este site
// gravam no mesmo banco sem colidir ids.
//
// O tenant é fixo por implantação: `NEXT_PUBLIC_PORTAL181_PATH` (env, hoje
// "PORTAL181" — case-sensitive, é o `path` do cliente na coleção `cliente`).
import {
  addDoc,
  collection,
  deleteDoc,
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

// Datas SEMPRE em milissegundos (regra do dono, 06/11/2026): Date e
// Timestamp antigo viram número ao gravar e ao ler (o servidor também só
// pode repassar dado simples aos componentes do navegador).
function simples<T>(v: T): T {
  if (v && typeof v === "object") {
    if (typeof (v as any).toMillis === "function") return (v as any).toMillis();
    if (v instanceof Date) return v.getTime() as any;
    if (Array.isArray(v)) return v.map(simples) as any;
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, simples(x)])) as T;
  }
  return v;
}

function tenantColRef(colecao: string) {
  if (!TENANT_PATH) {
    throw new Error(
      "NEXT_PUBLIC_PORTAL181_PATH não configurado — defina no .env.local (ou nas env vars do deploy) qual é o tenant deste site antes de ler/gravar no Firestore.",
    );
  }
  return collection(db, `dados/${TENANT_PATH}/${colecao}`);
}

// Listener em tempo real de uma coleção inteira — mesmo formato do
// `getAll` dos painéis.
export function getAll(colecao: string, callback: (docs: any[]) => void): Unsubscribe {
  return onSnapshot(tenantColRef(colecao), (snap) => {
    callback(snap.docs.map((d) => (simples({ id: d.id, ...d.data() }))));
  });
}

// Leitura pontual (sem listener) — usada quando não precisa ficar
// "escutando" mudanças, só ler uma vez (ex: páginas de conteúdo público).
export async function getAllOnce(colecao: string): Promise<any[]> {
  const snap = await getDocs(tenantColRef(colecao));
  return snap.docs.map((d) => (simples({ id: d.id, ...d.data() })));
}

export async function getDocOnce(colecao: string, id: string): Promise<any | null> {
  const snap = await getDoc(doc(tenantColRef(colecao), id));
  return snap.exists() ? simples({ id: snap.id, ...snap.data() }) : null;
}

// Listener em tempo real de um único doc — usado por quem já tem o id em
// mãos (ex: acompanhamento de denúncia por protocolo) e quer ver mudanças
// de status feitas na apuração operacional sem precisar recarregar.
export function getDocOn(colecao: string, id: string, callback: (doc: any | null) => void): Unsubscribe {
  return onSnapshot(doc(tenantColRef(colecao), id), (snap) => {
    callback(snap.exists() ? simples({ id: snap.id, ...snap.data() }) : null);
  });
}

// Contador sequencial por coleção — mesma mecânica do `addKey` do @hc/nucleo
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

// Grava um registro novo com id sequencial (o `onSaveIncrement` dos
// painéis): devolve o id. Campos `undefined` saem (o Firestore recusa).
export async function salvarNovo(colecao: string, data: Record<string, any>): Promise<string> {
  const id = String(await addKey(colecao));
  await setDoc(doc(tenantColRef(colecao), id), simples(limpar({ ...data, created_at: Date.now() })));
  return id;
}

// Atualiza campos de um registro (campos `undefined` saem).
export async function salvarAlteracao(colecao: string, id: string, data: Record<string, any>): Promise<void> {
  const { id: _ignorado, ...resto } = data;
  await setDoc(doc(tenantColRef(colecao), id), simples(limpar({ ...resto, updated_at: Date.now() })), { merge: true });
}

export async function excluirDoc(colecao: string, id: string): Promise<void> {
  await deleteDoc(doc(tenantColRef(colecao), id));
}

// Leitura pontual com um filtro de igualdade (ex.: usuário pelo login).
export async function getFilterOnce(colecao: string, campo: string, valor: any): Promise<any[]> {
  const snap = await getDocs(query(tenantColRef(colecao), where(campo, "==", valor)));
  return snap.docs.map((d) => (simples({ id: d.id, ...d.data() })));
}

function limpar(data: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

export async function criarDocComId(colecao: string, id: string, data: any): Promise<void> {
  await setDoc(doc(tenantColRef(colecao), id), simples(data));
}

// Cria com ID automático do Firestore (addDoc) — diferente de
// `criarDocComId`, usado quando não precisa de um ID previsível (ex:
// mensagens de chat, onde cada uma já é referenciada só pelo campo
// `idChat`, não pelo próprio id do doc).
export async function criarDoc(colecao: string, data: any): Promise<string> {
  const ref = await addDoc(tenantColRef(colecao), simples(data));
  return ref.id;
}

export async function atualizarDoc(colecao: string, id: string, data: any): Promise<void> {
  await updateDoc(doc(tenantColRef(colecao), id), simples(data));
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
  const dados: Record<string, any> = simples({ ...extras });
  for (const [campo, valor] of Object.entries(campos)) {
    dados[campo] = increment(valor);
  }
  await setDoc(doc(tenantColRef(colecao), id), dados, { merge: true });
}

// Listener em tempo real com um filtro + ordenação — usado pra mensagens
// de chat (filtra por `idChat`, ordena por `created_at`), mesmo padrão do
// `getFilterOn` dos painéis.
export function getFilterOn(
  colecao: string,
  campo: string,
  valor: any,
  ordenarPor: string,
  callback: (docs: any[]) => void,
): Unsubscribe {
  const q = query(tenantColRef(colecao), where(campo, "==", valor), orderBy(ordenarPor));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => (simples({ id: d.id, ...d.data() }))));
  });
}

// Upload pro Firebase Storage, mesmo padrão do `uploadFile` dos painéis —
// sobe em `uploads/{data}-{nome}` e retorna a URL pública. Usado pelos
// anexos da denúncia e pelas imagens do /admin.
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
