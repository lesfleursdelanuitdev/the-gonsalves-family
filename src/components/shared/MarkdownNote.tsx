import type { ReactNode } from "react";

// Inline token: text, bold, italic, or link
type Token =
  | { type: "text"; value: string }
  | { type: "bold"; children: Token[] }
  | { type: "italic"; children: Token[] }
  | { type: "link"; href: string; children: Token[] };

function parseInline(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let buf = "";

  const flush = () => {
    if (buf) { tokens.push({ type: "text", value: buf }); buf = ""; }
  };

  while (i < src.length) {
    // Bold **...**
    if (src[i] === "*" && src[i + 1] === "*") {
      const end = src.indexOf("**", i + 2);
      if (end !== -1) {
        flush();
        tokens.push({ type: "bold", children: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    // Italic *...* (single star, not double)
    if (src[i] === "*" && src[i + 1] !== "*") {
      const end = src.indexOf("*", i + 1);
      if (end !== -1) {
        flush();
        tokens.push({ type: "italic", children: parseInline(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    // Italic _..._
    if (src[i] === "_") {
      const end = src.indexOf("_", i + 1);
      if (end !== -1) {
        flush();
        tokens.push({ type: "italic", children: parseInline(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    // Link [text](url)
    if (src[i] === "[") {
      const closeBracket = src.indexOf("]", i + 1);
      if (closeBracket !== -1 && src[closeBracket + 1] === "(") {
        const closeParen = src.indexOf(")", closeBracket + 2);
        if (closeParen !== -1) {
          flush();
          const linkText = src.slice(i + 1, closeBracket);
          const href = src.slice(closeBracket + 2, closeParen);
          tokens.push({ type: "link", href, children: parseInline(linkText) });
          i = closeParen + 1;
          continue;
        }
      }
    }
    buf += src[i];
    i++;
  }
  flush();
  return tokens;
}

function renderTokens(tokens: Token[], keyPrefix: string): ReactNode[] {
  return tokens.map((tok, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (tok.type === "text") return tok.value;
    if (tok.type === "bold") return <strong key={key} className="font-semibold">{renderTokens(tok.children, key)}</strong>;
    if (tok.type === "italic") return <em key={key} className="italic">{renderTokens(tok.children, key)}</em>;
    if (tok.type === "link") {
      const href = tok.href;
      const safe = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("/") || href.startsWith("mailto:");
      return (
        <a
          key={key}
          href={safe ? href : "#"}
          target={href.startsWith("/") ? undefined : "_blank"}
          rel="noopener noreferrer"
          className="text-link underline underline-offset-2 transition hover:text-link-hover"
        >
          {renderTokens(tok.children, key)}
        </a>
      );
    }
    return null;
  });
}

function renderParagraph(block: string, blockIdx: number): ReactNode {
  const lines = block.split("\n");
  const parts: ReactNode[] = [];
  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) parts.push(<br key={`br-${blockIdx}-${lineIdx}`} />);
    parts.push(...renderTokens(parseInline(line), `${blockIdx}-${lineIdx}`));
  });
  return (
    <p key={blockIdx} className="mb-[0.65em] last:mb-0">
      {parts}
    </p>
  );
}

export function MarkdownNote({ content, className }: { content: string; className?: string }) {
  const blocks = content.split(/\n{2,}/).filter(Boolean);
  return (
    <div className={className}>
      {blocks.map((block, i) => renderParagraph(block, i))}
    </div>
  );
}
