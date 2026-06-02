export default function Loading() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-900">
      {/* Header skeleton */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-6">
        <div className="mx-auto max-w-7xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-zinc-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-48 rounded bg-zinc-800 animate-pulse" />
            <div className="h-3 w-32 rounded bg-zinc-800 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="h-4 w-36 rounded bg-zinc-800 animate-pulse mb-4" />
            <div className="h-48 rounded bg-zinc-800/50 animate-pulse" />
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-zinc-500 pb-8">
        Loading company data — this may take a moment for new tickers…
      </p>
    </div>
  );
}
