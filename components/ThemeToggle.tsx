"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

const emptySubscribe = () => () => {};

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Hydration-safe "are we on the client yet?" without a setState effect.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-lg bg-surface hover:bg-card-hover border border-border transition-all duration-200"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <FiSun className="w-5 h-5 text-accent" />
      ) : (
        <FiMoon className="w-5 h-5 text-accent" />
      )}
    </button>
  );
}
