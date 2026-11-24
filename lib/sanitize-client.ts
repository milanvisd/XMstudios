/**
 * Small browser-only HTML sanitizer for the editor preview.
 *
 * The public pages always sanitize server-side with `sanitize-html`; this is a
 * best-effort client pass so pasted HTML can't execute inside the editor
 * preview either.
 */
const ALLOWED_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "P",
  "BR",
  "HR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "UL",
  "OL",
  "LI",
  "BLOCKQUOTE",
  "PRE",
  "CODE",
  "A",
  "IMG",
  "MARK",
  "SPAN",
  "DIV",
  "FIGURE",
  "FIGCAPTION",
]);

const DROP_WITH_CONTENT = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "FORM",
  "INPUT",
  "BUTTON",
  "TEXTAREA",
  "SELECT",
  "LINK",
  "META",
  "SVG",
  "MATH",
]);

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("/")
  );
}

export function sanitizeClientHtml(html: string): string {
  if (typeof window === "undefined") return html;

  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll("*").forEach((element) => {
    if (DROP_WITH_CONTENT.has(element.tagName)) {
      element.remove();
      return;
    }

    if (!ALLOWED_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (name.startsWith("on") || name === "srcdoc") {
        element.removeAttribute(attribute.name);
        return;
      }

      if ((name === "href" || name === "src") && !isSafeUrl(value)) {
        element.removeAttribute(attribute.name);
        return;
      }

      if (name === "style") {
        const safe = value
          .split(";")
          .map((rule) => rule.trim())
          .filter((rule) =>
            /^(text-align:\s*(left|right|center|justify)|color:\s*[#a-z0-9(),.%\s]+|background-color:\s*[#a-z0-9(),.%\s]+)$/i.test(
              rule
            )
          )
          .join("; ");
        if (safe) element.setAttribute("style", safe);
        else element.removeAttribute("style");
      }
    });

    if (element.tagName === "A") {
      element.setAttribute("rel", "noopener noreferrer");
      if (/^https?:\/\//i.test(element.getAttribute("href") ?? "")) {
        element.setAttribute("target", "_blank");
      }
    }
  });

  return doc.body.innerHTML;
}
