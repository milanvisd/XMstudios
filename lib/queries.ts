import { cache } from "react";
import { getSupabase } from "./supabase";
import type { Game, GameSummary, NewsArticle, NewsSummary } from "./types";

const GAME_CARD_COLUMNS =
  "id,title,slug,short_description,cover_image,download_link,created_at";

const NEWS_CARD_COLUMNS =
  "id,title,slug,excerpt,featured_image,game_id,published_at,created_at,game:games(id,title,slug)";

function fail(context: string, error: { message: string }): never {
  throw new Error(`[${context}] ${error.message}`);
}

export const getGames = cache(async (): Promise<GameSummary[]> => {
  const { data, error } = await getSupabase()
    .from("games")
    .select(GAME_CARD_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) fail("getGames", error);
  return (data ?? []) as unknown as GameSummary[];
});

export const getLatestGames = cache(async (limit = 3): Promise<GameSummary[]> => {
  const { data, error } = await getSupabase()
    .from("games")
    .select(GAME_CARD_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) fail("getLatestGames", error);
  return (data ?? []) as unknown as GameSummary[];
});

export const getGameBySlug = cache(async (slug: string): Promise<Game | null> => {
  const { data, error } = await getSupabase()
    .from("games")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) fail("getGameBySlug", error);
  return (data as Game | null) ?? null;
});

export const getPublishedNews = cache(async (): Promise<NewsSummary[]> => {
  const { data, error } = await getSupabase()
    .from("news_articles")
    .select(NEWS_CARD_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) fail("getPublishedNews", error);
  return (data ?? []) as unknown as NewsSummary[];
});

export const getLatestNews = cache(async (limit = 3): Promise<NewsSummary[]> => {
  const { data, error } = await getSupabase()
    .from("news_articles")
    .select(NEWS_CARD_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) fail("getLatestNews", error);
  return (data ?? []) as unknown as NewsSummary[];
});

export const getNewsBySlug = cache(
  async (slug: string): Promise<NewsArticle | null> => {
    const { data, error } = await getSupabase()
      .from("news_articles")
      .select("*, game:games(id,title,slug)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) fail("getNewsBySlug", error);
    return (data as NewsArticle | null) ?? null;
  }
);

export const getRelatedNews = cache(
  async (gameId: string, limit = 5): Promise<NewsSummary[]> => {
    const { data, error } = await getSupabase()
      .from("news_articles")
      .select(NEWS_CARD_COLUMNS)
      .eq("game_id", gameId)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) fail("getRelatedNews", error);
    return (data ?? []) as unknown as NewsSummary[];
  }
);

/** Slugs for `generateStaticParams`. Never throws so builds can't be blocked. */
export async function getContentSlugs(): Promise<{
  games: string[];
  news: string[];
}> {
  try {
    const supabase = getSupabase();
    const [games, news] = await Promise.all([
      supabase.from("games").select("slug").order("created_at", { ascending: false }),
      supabase.from("news_articles").select("slug").eq("status", "published"),
    ]);

    return {
      games: (games.data ?? []).map((row) => row.slug as string),
      news: (news.data ?? []).map((row) => row.slug as string),
    };
  } catch {
    return { games: [], news: [] };
  }
}
