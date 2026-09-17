// Autenticação anônima do visitante — não é login (ninguém se identifica),
// é só um jeito de o Firestore diferenciar "alguém que passou pelo site
// (com uma sessão do Firebase Auth, mesmo anônima)" de "requisição sem
// nenhum vínculo com o app" nas regras (`request.auth != null`). Não
// coleta nome/e-mail/telefone — o uid gerado não identifica a pessoa,
// só a sessão do navegador (mesma ideia de lib/visitante.ts, mas ao nível
// do Firestore em vez de um id nosso em localStorage).
//
// Escopo: só o fluxo de denúncia e o chat do site usam isso (lib/
// denunciaClient.ts, lib/chatClient.ts) — as coleções de conteúdo público
// (procurados, desaparecidos, notícias etc.) continuam de leitura aberta,
// não precisam de sessão nenhuma.
//
// Gap conhecido: o hcCore ainda não usa Firebase Auth (ver firestore.rules)
// — por isso as regras do Firestore ainda NÃO foram apertadas para exigir
// `request.auth != null` em `denuncias`/`chats`/`messages`. Apertar agora
// quebraria as telas de apuração do hcCore, que leem essas coleções sem
// nenhuma sessão do Firebase Auth. Este helper deixa o site pronto para
// quando o hcCore também migrar.
//
// IMPORTANTE: como as regras ainda não exigem `request.auth != null`,
// essa sessão é "best effort" — nunca pode travar denúncia/chat.
// `ensureAnonAuth` NUNCA rejeita: se o provedor "Anônimo" ainda não foi
// habilitado no console do Firebase (Authentication > Sign-in method) ou
// a chamada falhar por qualquer motivo, resolve com `null` e quem chamou
// segue em frente gravando sem sessão, exatamente como funcionava antes
// deste arquivo existir.
import { getAuth, onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { firebaseApp } from "./client";

export const auth = getAuth(firebaseApp);

let sessaoPronta: Promise<User | null> | null = null;

// Tenta garantir uma sessão anônima e devolve o usuário (uid estável entre
// recarregamentos, o SDK persiste em IndexedDB no navegador) — ou `null`
// se não der. Chamar antes de leitura/escrita de denúncia ou chat, mas
// sem bloquear o fluxo no resultado: é só uma tentativa oportunista.
export function ensureAnonAuth(): Promise<User | null> {
  if (typeof window === "undefined") {
    // SSR (generateStaticParams/Server Components) nunca lida com
    // denúncia/chat — não deveria chamar isso, mas não deixa quebrar o build.
    return Promise.resolve(null);
  }
  if (sessaoPronta) return sessaoPronta;

  sessaoPronta = new Promise<User | null>((resolve) => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsub();
          resolve(user);
        } else {
          signInAnonymously(auth).catch((err) => {
            console.warn(
              "Firebase Auth anônimo indisponível (provedor \"Anônimo\" desabilitado no console? " +
                "veja Authentication > Sign-in method) — seguindo sem sessão:",
              err,
            );
            unsub();
            sessaoPronta = null;
            resolve(null);
          });
        }
      },
      (err) => {
        console.warn("Firebase Auth anônimo indisponível — seguindo sem sessão:", err);
        unsub();
        sessaoPronta = null;
        resolve(null);
      },
    );
  });

  return sessaoPronta;
}
