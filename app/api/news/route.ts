import { NextResponse } from "next/server";
import { getPublishedNews } from "@/lib/queries";

export const revalidate = 60;

/** Public feed: published articles only. Drafts must never be exposed here. */
export async function GET() {
  try {
    return NextResponse.json(await getPublishedNews());
  } catch {
    return NextResponse.json({ error: "Could not load news" }, { status: 503 });
  }
}
