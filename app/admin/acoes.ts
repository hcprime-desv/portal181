"use server";

import { revalidatePath } from "next/cache";

// Depois de salvar no /admin: renova o HTML guardado (ISR, 5 min) de todas
// as páginas públicas, para quem abrir o site agora já receber o conteúdo
// novo no primeiro carregamento. Só invalida cache — não lê nem grava dado.
export async function renovarSite(): Promise<void> {
  revalidatePath("/", "layout");
}
