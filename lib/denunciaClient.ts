// Registro de denúncia — client-side (export estático, sem servidor, ver
// next.config.js). Grava no MESMO formato que a apuração operacional do
// hcCore usa (ver hcCore/src/components/disquedenuncia/chat/Denuncia.tsx
// #handleSalvar) — sem isso, a denúncia nunca apareceria em nenhuma tela
// de apuração (elas filtram por `status_denuncia`, não existe outro jeito
// de "entrar" no fluxo operacional). O id do documento também segue o
// mesmo formato do resto do sistema (ver lib/protocolo.ts) — não existe
// campo `protocolo` separado, é sempre o próprio id do doc, igual as
// denúncias criadas internamente no hcCore.
//
// Gap conhecido: `dados`/`dinamicos` (campos específicos da natureza,
// Natureza.fields no hcCore) ficam vazios — o wizard público não tem UI
// pra campos dinâmicos por natureza ainda.
//
// Sem código de segurança (removido de propósito — ver types/denuncia.ts):
// tanto o envio quanto a consulta em /acompanhar são protegidos por um
// captcha simples (components/common/Captcha.tsx), não por um segredo
// pessoal — a coleção já é de leitura pública mesmo (firestore.rules).
import { criarDocComId } from "./firebase/gen";
import { ensureAnonAuth } from "./firebase/auth";
import { registrarEvento } from "./audiencia";
import { gerarProtocolo } from "./protocolo";
import type { DenunciaInput, DenunciaRegistro } from "@/types/denuncia";

// Firestore rejeita `undefined` em qualquer campo — os opcionais do
// formulário (municipio, bairro, endereco, procuradoId...) viram
// `undefined` quando não preenchidos.
function removerUndefined<T extends object>(obj: T): T {
  const limpo: any = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined) limpo[k] = v;
  });
  return limpo;
}

export async function registrarDenuncia(input: DenunciaInput): Promise<{ protocolo: string }> {
  // Sessão anônima do Firebase Auth antes de gravar — não identifica o
  // denunciante (é só um uid de sessão), mas deixa a escrita associada a
  // `request.auth != null` pra quando a regra do Firestore for apertada.
  await ensureAnonAuth();

  const protocolo = gerarProtocolo();
  const agora = Date.now();

  const registro: DenunciaRegistro = {
    ...input,

    // Operacional — mesmo shape do hcCore
    status: "novo",
    status_denuncia: "aguardando revisão",
    origem: "portal181",
    created_at: agora,
    status_at: agora,
    viewed_at: null,
    update_at: null,
    time: agora,
    dados: {},
    dinamicos: {},
    tags: [],

    // Site (tracker público)
    criadaEm: agora,
    atualizadaEm: agora,
    historico: [{ status: "recebida", data: agora }],
  };

  await criarDocComId("denuncias", protocolo, removerUndefined(registro));

  // Só a contagem — nenhum vínculo com o protocolo/relato desta denúncia
  // (ver lib/audiencia.ts).
  registrarEvento("denunciaConcluida");

  return { protocolo };
}
