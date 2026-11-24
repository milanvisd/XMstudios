import sanitizeHtml from "sanitize-html";

type SanitizeOptions = NonNullable<Parameters<typeof sanitizeHtml>[1]>;

const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "br",
  "hr",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "a",
  "img",
  "mark",
  "span",
  "div",
  "figure",
  "figcaption",
];

const ALIGNMENT = /^(left|right|center|justify)$/;
const COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i;

const options: SanitizeOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
    code: ["class"],
    pre: ["class"],
    mark: ["data-color"],
    span: ["style"],
    p: ["style"],
    div: ["style"],
    h1: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
  },
  allowedStyles: {
    "*": {
      "text-align": [ALIGNMENT],
      color: [COLOR],
      "background-color": [COLOR],
    },
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: (tagName, attribs) => {
      const isExternal = /^https?:\/\//i.test(attribs.href ?? "");
      return {
        tagName,
        attribs: isExternal
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" }
          : { ...attribs, rel: "noopener noreferrer" },
      };
    },
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: "lazy", decoding: "async" },
    }),
  },
};

/** Sanitize author-provided HTML/Markdown output before it reaches the DOM. */
export function sanitizeContent(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, options);
}
