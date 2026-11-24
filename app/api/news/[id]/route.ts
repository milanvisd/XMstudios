import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const revalidate = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { data, error } = await getSupabase()
      .from("news_articles")
      .select("*, game:games(id,title,slug)")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Could not load article" }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not load article" }, { status: 503 });
  }
}
