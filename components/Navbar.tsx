"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiMenu, FiX, FiEdit3 } from "react-icons/fi";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/news", label: "News" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav aria-label="Main" className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <span className="text-lg font-bold tracking-tight group-hover:text-accent transition-colors">
              SM Studios
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "bg-accent text-white"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="w-px h-6 bg-border mx-2" />
            <Link
              href="/editor/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-surface transition-all duration-200"
            >
              <FiEdit3 className="w-4 h-4" />
              Editor
            </Link>
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            className="md:hidden p-2 rounded-lg hover:bg-surface transition-colors"
          >
            {mobileOpen ? (
              <FiX className="w-5 h-5" />
            ) : (
              <FiMenu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-border bg-card">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={pathname === link.href ? "page" : undefined}
                className={`block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-accent text-white"
                    : "text-muted hover:bg-surface"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/editor/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted hover:text-accent hover:bg-surface"
            >
              <FiEdit3 className="w-4 h-4" />
              Editor
            </Link>
            <div className="px-4 py-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
