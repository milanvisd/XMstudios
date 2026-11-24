import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-xs">SM</span>
            </div>
            <span className="font-semibold">SM Studios</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/games" className="hover:text-foreground transition-colors">
              Games
            </Link>
            <Link href="/news" className="hover:text-foreground transition-colors">
              News
            </Link>
          </div>

          <p className="text-sm text-muted">Built by SM Studios</p>
        </div>

        <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} SM Studios. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
