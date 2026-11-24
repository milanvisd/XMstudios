"use client";

import { useEffect } from "react";
import { FiAlertTriangle } from "react-icons/fi";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-5">
        <FiAlertTriangle className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted mb-8">
        We couldn&apos;t load this page. Please try again in a moment.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
