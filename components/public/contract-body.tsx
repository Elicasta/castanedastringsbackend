function isHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 60) return false;
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;
  return letters === letters.toUpperCase();
}

/**
 * Renders a contract's plain-text body with a bit of actual typography:
 * lines that read as section headers (ALL CAPS, short) get pulled out as
 * real headings with spacing and a brand-colored rule, instead of the whole
 * thing being one undifferentiated block of text.
 */
export function ContractBody({ body }: { body: string }) {
  const lines = body.split("\n");
  const blocks: { type: "heading" | "text"; content: string }[] = [];
  let buffer: string[] = [];

  function flush() {
    if (buffer.length) {
      blocks.push({ type: "text", content: buffer.join("\n").trim() });
      buffer = [];
    }
  }

  for (const line of lines) {
    if (isHeading(line)) {
      flush();
      blocks.push({ type: "heading", content: line.trim() });
    } else {
      buffer.push(line);
    }
  }
  flush();

  return (
    <div className="space-y-1">
      {blocks.map((block, i) =>
        block.type === "heading" ? (
          <h3
            key={i}
            className="text-xs font-semibold tracking-wide uppercase text-brand-dark border-b border-brand-light pb-1.5 pt-4 first:pt-0"
          >
            {block.content}
          </h3>
        ) : (
          block.content && (
            <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap text-foreground py-1">
              {block.content}
            </p>
          )
        )
      )}
    </div>
  );
}
