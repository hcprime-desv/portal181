# Portal 181 — Disque Denúncia

Portal público (Next.js 15, App Router, TypeScript), inspirado em
https://disquedenuncia.ssp.ba.gov.br/, mas **genérico**: feito pra ser
reutilizado por outros estados/órgãos em hospedagens diferentes. Por isso
tudo que for específico de um estado (nome do órgão, naipes de baralho,
categorias de denúncia, cores) deve ser configurável via Firestore ou env,
nunca hardcoded assumindo "Bahia"/"SSP-BA".

**Este repositório é só o site público — não tem painel administrativo.**
Todo o CMS (Notícias, Procurados, Desaparecidos, Recompensas, Resultados,
Páginas, Usuários, Relatórios, Configurações, Carga de Dados, Baralhos)
vive num projeto separado, o **hcCore** (módulo "Portal181" dentro dele,
`sistema:"PORTAL181"`), que escreve nas mesmas coleções que este site lê.
Já existiu um esqueleto de `/admin` aqui (login próprio via cookie HMAC,
11 telas placeholder) — foi removido de propósito depois que o painel de
verdade passou a viver no hcCore. Não recriar um `/admin` aqui: qualquer
necessidade de administração de conteúdo é uma tela nova no hcCore, não
neste repositório.

Ver `documentacao/conceito.txt` e `documentacao/portal_181_wireframe.html`
(fonte do design/CSS usado em `app/globals.css`) para o conceito completo.
Ver `README.md` para detalhes técnicos de setup e estrutura de pastas.

## Decisões de arquitetura (e o porquê)

- **`output: "standalone"` — SSR/ISR real, servidor Node.js próprio
  on-premise.** Voltou à concepção original do projeto depois de uma fase
  de protótipo em `output: "export"` (100% estático, pra caber em
  hospedagem compartilhada tipo HostGator sem Node.js). Hoje a instalação
  é on-premise, na infraestrutura do próprio cliente (`next start` a
  partir de `.next/standalone` — ver README "Build e deploy"). Páginas de
  conteúdo (Procurados/Desaparecidos/Recompensas/Notícias/Home/menu de
  baralhos) são Server Components que buscam o dado uma vez
  (`listarX` de `lib/data.ts`) pra sair com HTML de verdade (SEO), com
  `export const revalidate = 300` (ISR); o componente client (ex:
  `ProcuradosLista`) recebe isso como prop inicial e assume dali com o
  listener em tempo real de sempre (`subscribeX`/`onSnapshot`) — uma
  edição no gerenciador de conteúdo aparece na hora em qualquer aba já
  aberta, sem esperar o revalidate. `/baralho/[slug]` e `/paginas/[slug]`
  continuam com `generateStaticParams` (agora só uma otimização de
  pré-render, não mais obrigatório) — como não é mais export estático, um
  slug novo já renderiza sob demanda na primeira visita, sem rebuild.
- **Sem Admin SDK, sem rota de API própria** — `lib/firebase/admin.ts`
  continua removido. Toda leitura/escrita passa por `lib/firebase/gen.ts`
  (client SDK do Firebase), no mesmo padrão do `shared/gen/gen.ts` do
  hcCore (getAll com onSnapshot, addKey via transação) — a diferença é
  que agora esse SDK client roda tanto no navegador quanto no processo
  Node do servidor (Server Components fazendo `getDocs` uma vez por
  request/revalidate), nunca via Admin SDK com credencial de serviço.
  Denúncia anônima e complemento continuam gravando direto do navegador
  (`lib/denunciaClient.ts`).
- **Firebase Auth anônimo** (`lib/firebase/auth.ts`, `ensureAnonAuth`) nos
  fluxos de denúncia (`lib/denunciaClient.ts`, `AcompanharForm.tsx`) e
  chat (`lib/chatClient.ts`) — não identifica o visitante (não é login,
  não coleta nome/e-mail), só garante uma sessão do Firebase Auth
  (`request.auth != null`) pra quando `firestore.rules` puder ser
  apertado. Ainda NÃO aperte a regra de `denuncias`/`chats`/`messages`
  pra exigir `request.auth != null` sem confirmar antes que o hcCore
  também migrou pra Firebase Auth — hoje as telas de apuração do hcCore
  leem essas coleções sem nenhuma sessão, e apertar a regra só deste lado
  quebraria o hcCore.
- **Mesmo projeto Firebase do hcCore** (`omnichannel-b4696`). Banco
  compartilhado, mesmo padrão multi-tenant: tudo fica em
  `dados/{tenant}/<colecao>` (não em coleções soltas na raiz). O tenant é
  lido de `NEXT_PUBLIC_PORTAL181_PATH` (env — precisa ser `NEXT_PUBLIC_`
  porque roda no navegador agora) — **sem valor padrão hardcoded** (hoje,
  `"DDBA"` — maiúsculo, confira sempre o `path` real do doc do cliente na
  coleção `cliente` do hcCore, é case-sensitive). Use sempre os helpers de
  `lib/firebase/gen.ts` pra acessar uma coleção — nunca `collection(db,
  "nome")` direto (isso ignora o prefixo do tenant).
- **Segurança real do projeto (leia antes de mexer em regras)**: nem o
  hcCore nem este site usam Firebase Auth — os dois fazem login próprio,
  sem `request.auth`. Isso significa que o Firestore **não tem como**
  diferenciar "o painel do hcCore escrevendo" de "qualquer visitante", e
  por isso `dados/{tenant}/**` precisa ficar aberto (leitura E escrita)
  sem autenticação — ver `firestore.rules` pro comentário completo.
  Consequência consciente e confirmada: a coleção `denuncias` é de
  leitura pública (qualquer um lê relato/local/envolvidos de qualquer
  denúncia, os protocolos são sequenciais). Não é uma falha nova
  introduzida aqui, é o preço de não ter Firebase Auth em nenhuma ponta —
  a solução de verdade, se algum dia precisar, é adicionar autenticação
  real nas duas aplicações.
- **Formato da denúncia = mesmo formato da apuração operacional do
  hcCore** (ver `hcCore/src/components/disquedenuncia/chat/Denuncia.tsx`
  `#handleSalvar`) — `status`/`status_denuncia`/`origem`/`dados`/
  `dinamicos`/timestamps no mesmo shape, senão a denúncia nunca apareceria
  em nenhuma tela de apuração (elas filtram por `status_denuncia`). O
  status "bonito" que o cidadão vê em `/acompanhar` é sempre DERIVADO de
  `status_denuncia` na hora de exibir (`lib/statusDenuncia.ts`), nunca
  gravado direto. Gap conhecido: `dados`/`dinamicos` (campos específicos
  da natureza, `Natureza.fields` no hcCore) ficam vazios — o wizard
  público não tem UI pra campos dinâmicos por natureza ainda. `historico`
  (timeline pro cidadão) também não é atualizado pelas telas operacionais
  do hcCore — só reflete criação e complementos feitos por aqui.
- **Anexos**: upload de verdade pro Firebase Storage
  (`lib/firebase/gen.ts#uploadFile`, mesmo padrão `uploads/{nome}` do
  hcCore), não só o nome do arquivo guardado localmente.
- **Fallback ilustrativo**: toda função de `lib/data.ts` cai num mock
  quando a leitura falha/não está configurada — o site inteiro navega
  antes de qualquer credencial existir. Não remover esse padrão ao editar.

## Feature "Baralho" (Baralho do Crime / Baralho Lilás)

Inspirado no site da SSP-BA, mas modelado como entidade genérica
`Baralho` (`types/baralho.ts`): nome, slug, lista de naipes e cartas ficam
no Firestore (`dados/{tenant}/baralhos` e `.../baralhoCartas`), não fixos
no código. Um tenant pode ter zero, um ou vários baralhos, com naipes
diferentes dos 4 clássicos. O menu (`Header.tsx`, SSR + listener em tempo
real) e a Home listam os baralhos ativos dinamicamente — nunca adicionar
um link fixo tipo "Baralho do Crime" no código. As CARTAS de um baralho
já existente são buscadas client-side e refletem sem rebuild; um baralho
NOVO (ou um slug renomeado) também já aparece sem rebuild desde que o
site saiu do export estático (`output: "standalone"`, ver "Decisões de
arquitetura") — `/baralho/[slug]` continua com `generateStaticParams`,
mas isso agora é só pré-render dos slugs conhecidos, não uma exigência.

## Estado atual / pendências

Ver a seção "Pendências conhecidas" no `README.md`. Resumo do que falta:
UI de campos dinâmicos por natureza no wizard (ver acima), `historico`
do tracker público não sincroniza com as mudanças feitas na apuração
operacional do hcCore, e o ponto de integração futura com o Denúncia 4.0
propriamente dito (hcCore/hcConecta) — hoje a integração É o hcCore ler
direto de `dados/{tenant}/denuncias`, não uma API separada.

## Ao mexer neste projeto

- Novo texto/config que varie por estado → checar primeiro se não devia
  vir do Firestore em vez de ser escrito direto no componente.
- Todo `page.tsx`/`layout.tsx` de `app/(public)/` que lê Firestore
  (`listarX` de `lib/data.ts`) é Server Component e roda em Node, não no
  navegador — depois de mexer neles (ou em `generateStaticParams`/
  `generateMetadata`), rodar `npm run build` pra garantir que ainda
  consegue ler o Firestore nessa hora.
- Página de listagem nova (Server Component) → seguir o padrão de
  `app/(public)/procurados/page.tsx` + `components/public/ProcuradosLista.tsx`:
  `listarX` no server pra SSR/SEO, `dadosIniciais` como prop pro
  componente client, que assume com `subscribeX` (`onSnapshot`) pra
  manter a atualização em tempo real depois da hidratação.
