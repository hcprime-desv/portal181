import type { EnvolvidoDenuncia, VeiculoDenuncia, AnexoDenuncia } from "./denuncia";

// Fallback/seed — usado só se dados/{tenant}/natureza ainda não tiver sido
// populada (ver lib/data.ts#listarNaturezas), ou se o Firestore falhar. A
// fonte de verdade em produção é a tabela de natureza da denúncia, a MESMA
// usada pela apuração operacional no hcCore, não uma lista própria do site.
export const NATUREZAS = [
  "Tráfico de drogas",
  "Homicídio",
  "Roubo e furto",
  "Violência contra a mulher",
  "Crime ambiental",
  "Corrupção",
  "Maus-tratos a animais",
  "Exploração infantil",
  "Facções criminosas",
  "Armas",
  "Outros crimes",
] as const;

export interface WizardState {
  natureza: string;
  relato: string;
  municipio: string;
  bairro: string;
  endereco: string;
  envolvidos: EnvolvidoDenuncia[];
  veiculos: VeiculoDenuncia[];
  // Já sobe pro Storage no momento da seleção (ver DenunciaWizard.tsx) —
  // aqui guarda o resultado (nome/tipo/tamanho/url), não só o nome.
  anexos: AnexoDenuncia[];
  enviandoAnexo: boolean;
}

export const WIZARD_INICIAL: WizardState = {
  natureza: "",
  relato: "",
  municipio: "",
  bairro: "",
  endereco: "",
  envolvidos: [],
  veiculos: [],
  anexos: [],
  enviandoAnexo: false,
};

export const PASSOS = ["Tipo", "Relato", "Local", "Envolvidos", "Veículos", "Anexos", "Revisão"] as const;
