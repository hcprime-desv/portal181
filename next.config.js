/** @type {import('next').NextConfig} */
const nextConfig = {
  // SSR/ISR de verdade, servidor Node próprio (`next start` ou
  // `.next/standalone`) — ver CLAUDE.md. Páginas de conteúdo saem com dado
  // real no HTML (SEO) e seguem ao vivo no navegador (onSnapshot).
  output: "standalone",
  reactStrictMode: true,
  // Os tipos são conferidos pelo `pnpm typecheck` (tsconfig.typecheck.json,
  // que fixa o @types/react 19 deste site). A checagem do `next build` usa o
  // tsconfig.json, onde next/lucide-react resolvem `react` para o @types/react
  // 18 içado dos painéis no store do pnpm e acusam erro falso (o mapeamento
  // não pode ir no tsconfig.json: o webpack passaria a importar os tipos).
  typescript: { ignoreBuildErrors: true },
  // Fixa a raiz do rastreio no próprio site: sem isso o standalone sai
  // aninhado no caminho absoluto do monorepo.
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
