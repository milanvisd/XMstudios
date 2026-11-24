/**
 * Deterministic date formatting.
 *
 * Server components run in UTC on Vercel while the dashboard runs in the
 * visitor's timezone. Pinning both to UTC + en-US keeps dates identical
 * everywhere (and avoids off-by-one-day diffs between server and client).
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
