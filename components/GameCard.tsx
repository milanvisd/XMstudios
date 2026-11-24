import Link from "next/link";
import Image from "next/image";
import { FiDownload } from "react-icons/fi";
import type { GameSummary } from "@/lib/types";

export default function GameCard({ game }: { game: GameSummary }) {
  return (
    <div className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
      <div className="relative aspect-video bg-surface overflow-hidden">
        {game.cover_image ? (
          <Image
            src={game.cover_image}
            alt={game.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-accent/20 to-accent/5">
            🎮
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors">
          <Link href={`/games/${game.slug}`}>{game.title}</Link>
        </h3>
        <p className="text-muted text-sm mb-4 line-clamp-2">
          {game.short_description || "No description available."}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={`/games/${game.slug}`}
            className="flex-1 text-center px-4 py-2 rounded-lg bg-surface border border-border text-sm font-medium hover:bg-accent hover:text-white hover:border-accent transition-all duration-200"
          >
            View Details
          </Link>
          {game.download_link && (
            <a
              href={game.download_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all duration-200"
            >
              <FiDownload className="w-4 h-4" />
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
