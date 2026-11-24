"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          {error.digest ? `Error reference: ${error.digest}` : "Please try again."}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.6rem 1.2rem",
            borderRadius: "0.75rem",
            background: "#3b82f6",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
