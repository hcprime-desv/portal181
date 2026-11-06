import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Revalidação sob demanda para quem está FORA deste site (ex.: um script ou
// outro sistema que grave conteúdo direto no banco). O /admin do próprio
// site não usa esta rota: renova o cache pela Server Action
// app/admin/acoes.ts#renovarSite. Exige o cabeçalho x-revalidate-secret
// igual a REVALIDATE_SECRET (.env); sem a variável, a rota recusa tudo.
// Só invalida o cache de rota do Next — não lê nem grava dado.
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
