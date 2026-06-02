"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp } from "lucide-react";
import SearchBar from "./SearchBar";

export default function NavBar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-semibold tracking-tight text-white">EarningsLens</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/calendar"
            className="rounded px-3 py-1.5 text-zinc-400 transition-colors hover:text-white"
          >
            Calendar
          </Link>
        </nav>

        {!isHome && (
          <div className="ml-auto w-64">
            <SearchBar compact />
          </div>
        )}
      </div>
    </header>
  );
}
