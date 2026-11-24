import { NextResponse } from "next/server";
import { marked } from "marked";

const MAX_LENGTH = 200_000;

export async function POST(request: Request) {
  try {
    const { markdown } = await request.json();

    if (typeof markdown !== "string") {
      return NextResponse.json({ error: "Invalid Markdown" }, { status: 400 });
    }
    if (markdown.length > MAX_LENGTH) {
      return NextResponse.json({ error: "Content too large" }, { status: 413 });
    }

    return NextResponse.json({ html: await marked.parse(markdown) });
  } catch {
    return NextResponse.json({ error: "Could not convert content" }, { status: 400 });
  }
}
