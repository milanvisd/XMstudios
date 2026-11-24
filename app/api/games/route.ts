import { NextResponse } from "next/server";
import { getGames } from "@/lib/queries";

export const revalidate = 60;

/** Public, read-only games feed. Writes happen from the authenticated dashboard. */
export async function GET() {
  try {
    return NextResponse.json(await getGames());
  } catch {
    return NextResponse.json({ error: "Could not load games" }, { status: 503 });
  }
}
