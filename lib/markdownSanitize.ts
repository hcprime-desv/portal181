import { defaultSchema } from "hast-util-sanitize";

// Schema usado por rehype-sanitize em toda renderização de Markdown do site
// (PaginaConteudo, AvisoModal, AvisoBanner). É o schema padrão do
// hast-util-sanitize — mesma sanitização "estilo GitHub" usada em README:
// já libera uma lista específica de tags seguras (details/summary, table,
// img, a, code, span, div etc., <details open> incluso) e BLOQUEIA o que
// poderia ser perigoso (script, iframe, form, qualquer atributo on*, links
// javascript:). Cadastrado só por administradores no hcCore, não por
// visitante do site — mas sanitiza mesmo assim: defesa em profundidade,
// caso uma conta do painel seja comprometida ou alguém cole HTML de origem
// desconhecida sem perceber o risco.
export const markdownSanitizeSchema = defaultSchema;
