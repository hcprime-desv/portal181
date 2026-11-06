// Markdown do site (páginas, avisos, pré-visualização no /admin): GFM e o
// HTML permitido por lib/markdownSanitize.ts (script/iframe/on* saem).
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { markdownSanitizeSchema } from "@/lib/markdownSanitize";

export default function Markdown({ children }: { children?: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}>
      {children || ""}
    </ReactMarkdown>
  );
}
