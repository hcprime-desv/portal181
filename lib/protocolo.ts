// Gera o ID da denúncia (vira o próprio id do documento em
// dados/{tenant}/denuncias) — usado tanto pra gravar quanto pra
// acompanhar depois (sem código de segurança, ver types/denuncia.ts).
//
// Mesmo formato usado pelo resto do sistema pra chamados avulsos
// (aaaaMMdd.NNNNNN.HHmmssSSS — ver generateIdUserDateTime no hcCore e
// gerarProtocoloAtendimentoApp no hcpesquisa) — antes este site usava um
// formato próprio (181-AAAA-NNNNNNNN), mas isso deixava as denúncias
// vindas do site com um "id" diferente das criadas internamente no
// hcCore, dificultando reconhecer o padrão. "500000" no meio marca que a
// denúncia nasceu no formulário público do site (100000 = app mobile
// hcpesquisa, 300000 = chat do site — ver lib/chatClient.ts — outros
// valores são de entradas internas do hcCore).
//
// Sem contador sequencial: o timestamp com milissegundo já garante
// unicidade na prática (mesma escolha do resto do sistema, sem
// transação no Firestore só pra gerar um número).
export function gerarProtocolo(): string {
  const now = new Date();
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const pad3 = (n: number) => String(n).padStart(3, "0");
  const dateStr = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const timeStr = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}${pad3(now.getMilliseconds())}`;
  return `${dateStr}.500000.${timeStr}`;
}
