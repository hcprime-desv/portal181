// CÓPIA gerada por scripts/copiar-admin-site.py — NÃO edite aqui: altere em packages/layout/src/sites/admin e copie de novo.
// /admin dos SITES — acesso ao banco do site (BASE_SITE = NEXT_PUBLIC_SITE_PATH, caminho completo: sites/<empresa> ou
// dados/<TENANT>). Mesmas convenções dos painéis do core360: id SEQUENCIAL pelo contador `incrementKey/<coleção>`
// (countKey), datas em milissegundos (created_at/updated_at), sem campos undefined.
import {
  collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, runTransaction, setDoc, updateDoc, where,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { db, firebaseApp } from "@/lib/firebase/client";
import { BASE_SITE } from "@/lib/firebase/gen";

const base = () => {
  if (!BASE_SITE) throw new Error("Banco do site não configurado (NEXT_PUBLIC_SITE_PATH).");
  return BASE_SITE;
};
const limpo = (d: Record<string, any>) => Object.fromEntries(Object.entries(d).filter(([k, v]) => v !== undefined && k !== "id"));

/** Lista ao vivo (devolve a função que para de ouvir). */
export function ouvir(colecao: string, aoMudar: (docs: any[]) => void): () => void {
  return onSnapshot(collection(db, `${base()}/${colecao}`), (s) => aoMudar(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => aoMudar([]));
}

export async function lerTodos(colecao: string): Promise<any[]> {
  const s = await getDocs(collection(db, `${base()}/${colecao}`));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function lerDoc(colecao: string, id: string): Promise<any | null> {
  const d = await getDoc(doc(db, `${base()}/${colecao}/${id}`));
  return d.exists() ? { id: d.id, ...d.data() } : null;
}

export async function filtrar(colecao: string, campo: string, valor: unknown): Promise<any[]> {
  const s = await getDocs(query(collection(db, `${base()}/${colecao}`), where(campo, "==", valor)));
  return s.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Novo registro com id sequencial (o mesmo contador dos painéis). */
export async function criar(colecao: string, dados: Record<string, any>): Promise<string> {
  const contador = doc(db, `${base()}/incrementKey/${colecao}`);
  const id = await runTransaction(db, async (t) => {
    const s = await t.get(contador);
    const prox = (s.exists() ? Number(s.data().countKey) || 0 : 0) + 1;
    t.set(contador, { countKey: prox });
    return String(prox);
  });
  const agora = Date.now();
  await setDoc(doc(db, `${base()}/${colecao}/${id}`), { ...limpo(dados), created_at: agora, updated_at: agora });
  return id;
}

export async function alterar(colecao: string, id: string, dados: Record<string, any>): Promise<void> {
  await updateDoc(doc(db, `${base()}/${colecao}/${id}`), { ...limpo(dados), updated_at: Date.now() });
}

export async function excluir(colecao: string, id: string): Promise<void> {
  await deleteDoc(doc(db, `${base()}/${colecao}/${id}`));
}

/** Sobe um arquivo para o Storage e devolve o link público (pasta própria por envio). */
export async function subirArquivo(f: File): Promise<string> {
  const pasta = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  const r = ref(getStorage(firebaseApp), `uploads/${pasta}/${f.name}`);
  await uploadBytes(r, f, { contentType: f.type || undefined });
  return getDownloadURL(r);
}
