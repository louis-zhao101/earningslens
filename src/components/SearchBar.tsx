"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface Result {
  ticker: string;
  name: string;
  exchange: string | null;
}

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  function navigate(ticker: string) {
    setQuery("");
    setOpen(false);
    setResults([]);
    router.push(`/company/${ticker}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      navigate(query.trim().toUpperCase());
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 transition-colors focus-within:border-zinc-500 ${compact ? "h-8 text-sm" : "h-12 text-base"}`}
      >
        <Search className={`shrink-0 text-zinc-500 ${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
        <input
          className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none"
          placeholder={compact ? "Search ticker or company…" : "Search for a stock — e.g. AAPL, Tesla"}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 shadow-xl">
          {results.slice(0, 8).map((r) => (
            <li key={r.ticker}>
              <button
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-zinc-800"
                onClick={() => navigate(r.ticker)}
              >
                <span className="w-14 shrink-0 font-mono font-semibold text-emerald-400">
                  {r.ticker}
                </span>
                <span className="flex-1 truncate text-zinc-300">{r.name}</span>
                {r.exchange && (
                  <span className="shrink-0 text-xs text-zinc-600">{r.exchange}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
