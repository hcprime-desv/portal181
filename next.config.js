/** @type {import('next').NextConfig} */
const nextConfig = {
  // Voltou a ser SSR/ISR de verdade (era a concepção original do projeto,
  // ver CLAUDE.md) — a instalação passou a ser on-premise, num servidor
  // Node.js da própria SSP/BA (`next start` a partir de `.next/standalone`),
  // não mais export estático por FTP. Páginas de conteúdo (Procurados,
  // Desaparecidos, Recompensas, Notícias, baralho/[slug], páginas/[slug])
  // agora renderizam com dado real no HTML (SEO de verdade) e continuam
  // recebendo atualização em tempo real no cliente via onSnapshot
  // (lib/firebase/gen.ts#getAll) depois da hidratação — ver lib/data.ts
  // (par listarX/subscribeX) e os componentes client em components/public.
  output: "standalone",
  reactStrictMode: true,
  // Sem isso, o Next detecta um lockfile solto num diretório acima (fora
  // deste projeto, ex: outro repo no mesmo D:\) e assume ELE como raiz do
  // "monorepo" — o output de `output: "standalone"` sai aninhado num
  // caminho absoluto gigante (`.next/standalone/<caminho todo até aqui>/`)
  // em vez de `.next/standalone/` direto. Fixando a raiz aqui garante que
  // o standalone sempre sai no formato esperado, não importa o que exista
  // fora desta pasta.
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
