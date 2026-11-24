import { getGames } from "@/lib/queries";
import GameCard from "@/components/GameCard";

export const metadata = {
  title: "Games",
  description: "Browse all games from SM Studios",
};

export const revalidate = 60;

export default async function GamesPage() {
  const games = await getGames();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Our Games</h1>
        <p className="text-muted text-lg">
          Explore the games we&apos;ve been working on. Each one crafted with care.
        </p>
      </div>

      {games.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-xl font-semibold mb-2">No games yet</h2>
          <p className="text-muted">
            Check back soon — we&apos;re always working on something new.
          </p>
        </div>
      )}
    </div>
  );
}
