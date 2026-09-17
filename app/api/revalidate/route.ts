import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Revalidação sob demanda — chamada pelo hcCore logo depois de
// criar/editar/excluir um registro no painel (Notícias, Procurados,
// Desaparecidos, Recompensas, Baralhos), pra não depender só do
// `revalidate = 300` de cada página (até 5min de defasagem). Não é
// leitura/escrita de dado nenhum — só invalida o cache de rota do Next.js,
// por isso o "segredo" abaixo é uma proteção básica contra invalidação
// abusiva vinda de fora, não um controle de acesso a dado sensível (o
// hcCore é client-side/estático, então esse valor não pode ficar 100%
// oculto de qualquer forma).
//
// hcCore chama isso via `fetch()` direto do navegador (é uma app
// client-side/estática, `output: "export"`), de uma origem diferente
// (porta diferente em dev, domínio diferente em produção) — por isso
// precisa de CORS liberado aqui, senão o navegador bloqueia a requisição
// antes de sair (aparece como "Failed to fetch", nem chega a virar um
// 401/403 de verdade).
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-revalidate-secret",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401, headers: CORS_HEADERS });
  }

  const body = await req.json().catch(() => null);
  const paths = body?.paths;
  if (!Array.isArray(paths) || paths.length === 0 || !paths.every((p) => typeof p === "string")) {
    return NextResponse.json(
      { error: "Informe 'paths' (array de rotas, ex: [\"/noticias\"])" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  paths.forEach((p: string) => revalidatePath(p));

  return NextResponse.json({ revalidated: paths }, { headers: CORS_HEADERS });
}
