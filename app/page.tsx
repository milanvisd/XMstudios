import Link from "next/link";
import { FiArrowRight, FiFileText } from "react-icons/fi";

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent/5" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Creating
              <span className="text-accent"> amazing </span>
              gaming experiences
            </h1>
            <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl">
              We build games that inspire, challenge, and entertain. Explore our
              latest projects and stay updated with our newest releases.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/games"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-all duration-200 shadow-lg shadow-accent/25"
              >
                Browse Games
                <FiArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/news"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface border border-border font-medium hover:bg-card-hover transition-all duration-200"
              >
                <FiFileText className="w-5 h-5" />
                Read Our News
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to play?</h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            Check out our games and download them today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/games"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-all duration-200"
            >
              Browse Games
              <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
