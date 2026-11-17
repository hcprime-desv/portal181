"use server";

import { revalidatePath } from "next/cache";

// Depois de salvar no /admin: renova o HTML guardado de todas as páginas públicas (só invalida cache).
export async function renovarSite(): Promise<void> {
  revalidatePath("/", "layout");
}
