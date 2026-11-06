// Cabeçalho das páginas internas no layout do site padrão (.pagina-cab) e o
// corpo (.section .pagina-corpo) — o mesmo do PaginaDinamica do p2pcorp.
export function CabecalhoPagina({ titulo, resumo, chamada, imagemUrl, children }: {
  titulo: string; resumo?: string; chamada?: string; imagemUrl?: string | null; children?: React.ReactNode;
}) {
  return (
    <section className={`pagina-cab${imagemUrl ? " com-imagem" : ""}`} style={imagemUrl ? ({ ["--cab-img" as any]: `url('${imagemUrl}')` } as React.CSSProperties) : undefined}>
      <div className="container">
        {chamada && <div className="eyebrow">{chamada}</div>}
        <h1>{titulo}</h1>
        {resumo && <p>{resumo}</p>}
        {children}
      </div>
    </section>
  );
}

export function CorpoPagina({ estreito = false, children }: { estreito?: boolean; children: React.ReactNode }) {
  return (
    <section className="section pagina-corpo">
      <div className={`container${estreito ? " estreito" : ""}`}>{children}</div>
    </section>
  );
}

// Atalho: cabeçalho + corpo.
export default function Pagina({ titulo, resumo, chamada, estreito, children }: {
  titulo: string; resumo?: string; chamada?: string; estreito?: boolean; children: React.ReactNode;
}) {
  return (
    <>
      <CabecalhoPagina titulo={titulo} resumo={resumo} chamada={chamada} />
      <CorpoPagina estreito={estreito}>{children}</CorpoPagina>
    </>
  );
}
