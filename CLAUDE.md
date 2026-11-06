# Portal 181 — Disque Denúncia (site + /admin)

Site público do Disque Denúncia (Next.js 15, App Router, React 19), **genérico**
para qualquer estado/órgão: nome, cores, logo, banner, tema, menu, baralhos e
categorias vêm do banco (nunca "Bahia"/"SSP-BA" no código). Inspirado em
https://disquedenuncia.ssp.ba.gov.br/.

**O site tem o próprio painel em `/admin`** (decisão do dono, 06/11/2026: todo
site é gerenciado pelo admsite360 ou pelo `/admin` dele mesmo). O antigo painel
web `apps/portal181` (copiado do DD360) foi APAGADO; as telas dele viraram o
`/admin`. O DD360 (`apps/dd360`) continua sendo o operacional das denúncias
(apuração, chat, natureza) e lê as mesmas coleções.

## Layout = o do site padrão (p2pcorp)
- `app/globals.css` = CSS do `sites/p2pcorp` COPIADO (que é o do site ViaMob360)
  + "Complemento Portal 181" no fim (procurados, baralho, denúncia em etapas,
  acompanhamento, busca, avisos) + o CSS do `/admin`. Mesmas classes do padrão:
  topbar/nav/links/nav-actions, hero/hero-numeros/chips, faixa-cards/cards8,
  section/section-head, flow/step, cta, pagina-cab/pagina-corpo, footer-grid.
  Mudou o visual comum lá → copiar para cá. Sem Tailwind.
- Moldura: `components/public/{Header,Footer,AoVivo,Tema,CabecalhoPagina,Cartoes}`.
  `AoVivoProvider` = configuração AO VIVO (o `/admin` salva, o site muda sem
  recarregar) e o wrapper `.tema` com as cores (`corSecundaria`→`--cor`/azul,
  `corDestaque`→`--destaque`/verde, `corPrimaria`→`--escura`/navy).
- Tema claro/escuro igual ao p2pcorp (`tema`: automatico|claro|escuro,
  `temaBotao`; script do `<head>` em `lib/tema.ts`, sem piscar).
- Menu (Header): Início, Procurados, Desaparecidos, Baralhos▾ (os ativos),
  Recompensas, Notícias, Institucional▾ (Sobre + páginas com "Exibir em: Menu";
  o mesmo `submenu` vira subtítulo). Cada item liga/desliga em Configuração →
  "Itens do menu". Botão vermelho "Denunciar" (`menuDenuncie`).
- Logos: `public/images/logo-portal181.png`, `-branco.png` (tema escuro e
  rodapé), `simbolo-portal181.png` (favicon) — `python scripts/gerar-marca.py
  portal181` (na raiz do core360) regera direto aqui. Logo da Configuração tem
  prioridade. Banner padrão: `public/images/hero-bg.jpg`.

## /admin
- Rotas: `/admin` (Painel: audiência), `/admin/relatorios`, `/admin/configuracao`,
  `/admin/carga` e `/admin/<cadastro>` (noticias, procurados, desaparecidos,
  recompensas, resultados, avisos, baralhos, cartas, paginas, usuarios, grupos).
- Cadastro novo = uma entrada em `lib/admin/cadastros.ts` (campos, colunas,
  `preparar`) + item em `MENU_ADMIN` (`components/admin/AdminShell.tsx`). O
  componente genérico `components/admin/Cadastro.tsx` faz lista ao vivo, busca,
  formulário (`Campos.tsx`: texto, data dd/mm/aaaa, select fixo ou de coleção,
  imagem com upload no Storage, markdown com pré-visualização, cor, lista,
  senha, permissões) e exclusão.
- Login (`lib/admin/sessao.ts`) = os MESMOS usuários do core360:
  `dados/{tenant}/usuarios` (e-mail ou login), senha PBKDF2 conferida pelo
  `@hc/nucleo/compartilhado/senhas`, `nivel` "99"/perfil administrador vê tudo,
  os demais o que o grupo (`grupo.permissions`) libera. Chaves de permissão =
  as do antigo painel (`menu.portal181.*`, `menu.configuracoes.login`,
  `menu.grupo`) — os grupos já gravados valem. Sessão no localStorage
  (`admin-portal181`, 12 h), revalidada ao abrir (desativado sai na hora).
  Administrador: `adm.portal181` / 123456 (provisória).
- Grava com id sequencial (`salvarNovo` → mesmo contador `incrementKey` dos
  painéis) e deixa a trilha em `logs_auditoria` (formato dos painéis,
  `origem: "painel_web"`, `modulo: "portal181"`, sem senha/hash).
- Depois de salvar, `app/admin/acoes.ts#renovarSite` (Server Action) renova o
  HTML guardado das páginas públicas (ISR de 5 min). A rota
  `app/api/revalidate` fica só para quem está fora (exige `REVALIDATE_SECRET`).
- Carga de dados de teste (`/admin/carga`): exemplo de tudo marcado
  `_cargaTeste: true`; "Apagar dados de teste" tira só esses.
- Segurança: como em todos os painéis do ecossistema (sem Firebase Auth), a
  checagem é no navegador e o Firestore aceita escrita em `dados/{tenant}/**`
  (ver `firestore.rules`). Não é proteção contra quem chama o Firestore direto.

## Dados
- Firestore `omnichannel-b4696`, tudo em `dados/{tenant}/<colecao>` — tenant =
  `NEXT_PUBLIC_PORTAL181_PATH` (.env.local, hoje `PORTAL181`, case-sensitive).
  Sempre pelos helpers de `lib/firebase/gen.ts` (nunca `collection(db, ...)`).
- Coleções: noticias, procurados, desaparecidos, recompensas, resultados,
  avisos, baralhos, baralhoCartas, paginas, configuracoes/geral, natureza
  (do DD360), denuncias, chats/messages, audienciaSessoes/audienciaContadores,
  usuarios, grupo, logs_auditoria.
- "Ativo (visível no site)" = `ativo !== false` (cadastro antigo sem o campo
  aparece). Notícias: `data` texto dd/mm/aaaa, ordenada pela data de verdade.
- `lib/data.ts`: par `listarX` (servidor, SSR/SEO, ISR 5 min) / `subscribeX`
  (navegador, onSnapshot). Toda função cai num exemplo ilustrativo se a
  leitura falhar (o site nunca abre em branco) — não remover esse padrão.

## Denúncia, chat e audiência (não mudou)
- Denúncia anônima no mesmo formato da apuração do DD360
  (`status_denuncia`...), protocolo `181-AAAA-NNNNNNNN` + código de segurança,
  anexos no Storage, Firebase Auth anônimo só como sessão. Status "bonito" do
  `/acompanhar` é derivado (`lib/statusDenuncia.ts`).
- Chat do site (`components/chat`) → central do OmniChannel (atendido no DD360).
- Audiência: só contagens agregadas (`lib/audiencia.ts`), lidas no Painel.

## Build
- Na raiz: `pnpm --filter portal181 dev` / `build`, ou `pnpm dev`/`pnpm build`
  dentro da pasta. Servidor: `next start` (ou `.next/standalone`; no Windows o
  standalone avisa EPERM de symlink — build ok).
- Tipos: `pnpm typecheck` (tsconfig.typecheck.json, @types/react 19 do site).
  O `next build` NÃO checa tipos (`typescript.ignoreBuildErrors`): pelo
  tsconfig.json, next/lucide-react resolvem `react` para o @types/react 18
  içado dos painéis e acusam erro falso (o p2pcorp tem o mesmo problema).
