export interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  cover_image: string;
  screenshots: string[];
  download_link: string;
  created_at: string;
  updated_at: string;
}

/** The columns list/card views actually need. */
export type GameSummary = Pick<
  Game,
  | "id"
  | "title"
  | "slug"
  | "short_description"
  | "cover_image"
  | "download_link"
  | "created_at"
>;

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_format: "html" | "markdown";
  featured_image: string;
  game_id: string | null;
  status: "draft" | "published";
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  game?: Pick<Game, "id" | "title" | "slug"> | null;
}

/** The columns list/card views actually need (never the full body). */
export type NewsSummary = Pick<
  NewsArticle,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "featured_image"
  | "game_id"
  | "published_at"
  | "created_at"
> & {
  game: Pick<Game, "id" | "title" | "slug"> | null;
};
