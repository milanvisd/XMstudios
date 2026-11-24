import { NextResponse } from "next/server";
import TurndownService from "turndown";

const MAX_LENGTH = 200_000;

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
});

// Keep content that Turndown drops by default.
turndown.keep(["u", "mark", "span"]);

export async function POST(request: Request) {
  try {
    const { html } = await request.json();

    if (typeof html !== "string") {
      return NextResponse.json({ error: "Invalid HTML" }, { status: 400 });
    }
    if (html.length > MAX_LENGTH) {
      return NextResponse.json({ error: "Content too large" }, { status: 413 });
    }

    return NextResponse.json({ markdown: turndown.turndown(html) });
  } catch {
    return NextResponse.json({ error: "Could not convert content" }, { status: 400 });
  }
}
