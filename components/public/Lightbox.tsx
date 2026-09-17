"use client";

import { X } from "lucide-react";

// Popup simples que mostra só a imagem em tamanho maior — usado nos cards
// de Procurados/Desaparecidos (clicar na foto amplia). Fecha clicando fora
// da imagem ou no X.
export default function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button type="button" className="lightbox-close" onClick={onClose} aria-label="Fechar">
        <X size={22} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="lightbox-img" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
