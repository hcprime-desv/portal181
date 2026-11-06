"use client";

// Rodapé no layout do site padrão (footer-grid/footer-marca/footer-fim):
// logo branco + texto, colunas "Denúncia", "Consultas", "Institucional"
// (páginas com "Exibir em: Rodapé") e "Contato", e a linha final com a
// assinatura da P2P Corp. Tudo da Configuração do site e das Páginas (/admin).
import Link from "next/link";
import { useEffect, useState } from "react";
import { subscribePaginasPublicadas } from "@/lib/data";
import { nomeDoSite, useConfiguracao } from "./AoVivo";
import { LogoMarca } from "./Header";
import type { Pagina } from "@/types/conteudo";

const soDigitos = (v?: string) => (v || "").replace(/\D/g, "");

export default function Footer({ paginasIniciais }: { paginasIniciais: Pagina[] }) {
  const c = useConfiguracao();
  const [paginas, setPaginas] = useState(paginasIniciais);
  useEffect(() => subscribePaginasPublicadas(setPaginas), []);
  const doRodape = paginas.filter((p) => (p.local ?? "Rodapé") === "Rodapé");
  return (
    <footer>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-marca">
            <LogoMarca branco />
            <p>{c.textoRodape || "Sua informação pode proteger uma vida. Denuncie de forma anônima, segura e protegida."}</p>
          </div>
          <div>
            <h4>Denúncia</h4>
            {c.menuDenuncie !== false && <Link href="/denuncie">Fazer denúncia</Link>}
            <Link href="/acompanhar">Acompanhar protocolo</Link>
            <a href="tel:181">Ligar 181</a>
          </div>
          <div>
            <h4>Consultas</h4>
            {c.menuProcurados !== false && <Link href="/procurados">Procurados</Link>}
            {c.menuDesaparecidos !== false && <Link href="/desaparecidos">Desaparecidos</Link>}
            {c.menuRecompensas !== false && <Link href="/recompensas">Recompensas</Link>}
            {c.menuNoticias !== false && <Link href="/noticias">Notícias</Link>}
            <Link href="/busca">Buscar no site</Link>
          </div>
          <div>
            <h4>Institucional</h4>
            {c.menuSobre !== false && <Link href="/sobre">Como funciona o 181</Link>}
            {doRodape.map((p) => <Link key={p.id} href={`/paginas/${p.slug}`}>{p.titulo}</Link>)}
          </div>
          <div>
            <h4>Contato</h4>
            <a href="tel:181">Disque 181</a>
            {c.telefone && <a href={`tel:+55${soDigitos(c.telefone)}`}>{c.telefone}</a>}
            {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
            {c.endereco && <p>{c.endereco}</p>}
          </div>
        </div>
        <div className="footer-fim">
          <div className="copy">
            <span>© {new Date().getFullYear()} {nomeDoSite(c)}. Todos os direitos reservados.</span>
            <span>Anonimato • Segurança • Cidadania • Resultados</span>
          </div>
          <div className="copy">
            <span>Tecnologia P2P Corp</span>
            <Link href="/admin">Área restrita</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
