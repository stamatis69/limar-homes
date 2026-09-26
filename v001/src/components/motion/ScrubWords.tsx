import { createElement } from "react";

/**
 * Statement text whose words "ink in" as it scrolls through the viewport ([data-words], motion.ts).
 * Words are real text nodes (screen readers and search read the sentence normally). The unlit colour
 * still meets 3:1 for large text, so the statement is legible at every scroll position.
 */
export function ScrubWords({ text, as = "p", className, id }: { text: string; as?: "p" | "h2" | "h3"; className?: string; id?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return createElement(
    as,
    { className: `scrub-words${className ? ` ${className}` : ""}`, "data-words": "", id },
    words.map((w, i) => (
      <span key={i} className="w">
        {w}
        {i < words.length - 1 ? " " : ""}
      </span>
    )),
  );
}
