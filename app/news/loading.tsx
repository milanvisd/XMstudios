export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="h-8 w-64 rounded-lg bg-surface animate-pulse mb-3" />
      <div className="h-5 w-80 max-w-full rounded bg-surface animate-pulse mb-10" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="aspect-video bg-surface animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-1/3 rounded bg-surface animate-pulse" />
              <div className="h-5 w-3/4 rounded bg-surface animate-pulse" />
              <div className="h-4 w-full rounded bg-surface animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
