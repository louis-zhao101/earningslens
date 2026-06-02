import { TrendingUp, Calendar, BarChart2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import SearchBar from "@/components/SearchBar";
import { formatDate, formatEPS, formatPct, surpriseColor } from "@/lib/format";
import Link from "next/link";

async function getUpcomingEarnings() {
  return prisma.earningsEvent.findMany({
    where: {
      isUpcoming: true,
      reportDate: { gte: new Date() },
    },
    include: { company: { select: { ticker: true, name: true, sector: true } } },
    orderBy: { reportDate: "asc" },
    take: 10,
  }).catch(() => []);
}

async function getRecentEarnings() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return prisma.earningsEvent.findMany({
    where: {
      isUpcoming: false,
      isConfirmed: true,
      reportDate: { gte: weekAgo, lte: new Date() },
    },
    include: { company: { select: { ticker: true, name: true, sector: true } } },
    orderBy: { reportDate: "desc" },
    take: 10,
  }).catch(() => []);
}

export default async function Home() {
  const [upcoming, recent] = await Promise.all([getUpcomingEarnings(), getRecentEarnings()]);

  return (
    <div className="flex flex-col flex-1">
      {/* Hero */}
      <section className="border-b border-zinc-800 bg-zinc-950 py-16 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 flex justify-center">
            <TrendingUp className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-white">
            EarningsLens
          </h1>
          <p className="mb-8 text-zinc-400">
            Historical earnings analysis, financial data, and stock price reactions for public companies.
          </p>
          <div className="mx-auto max-w-lg">
            <SearchBar />
          </div>
          <p className="mt-3 text-xs text-zinc-600">
            Search by ticker (AAPL) or company name (Apple)
          </p>
        </div>
      </section>

      {/* Content grid */}
      <section className="flex-1 bg-zinc-900 px-4 py-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Upcoming earnings */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Calendar className="h-4 w-4 text-zinc-400" />
                Upcoming Earnings
              </h2>
              <Link href="/calendar" className="text-xs text-emerald-400 hover:underline">
                View calendar →
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <EmptyState message="No upcoming earnings in the database yet." />
            ) : (
              <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950">
                {upcoming.map((e) => (
                  <Link
                    key={e.id}
                    href={`/company/${e.company.ticker}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-sm font-semibold text-emerald-400">
                          {e.company.ticker}
                        </span>
                        <span className="truncate text-sm text-zinc-300">{e.company.name}</span>
                      </div>
                      {e.company.sector && (
                        <div className="text-xs text-zinc-500">{e.company.sector}</div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm text-white">{formatDate(e.reportDate)}</div>
                      {e.callTime && (
                        <div className="text-xs uppercase text-zinc-600">{e.callTime}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent earnings */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <BarChart2 className="h-4 w-4 text-zinc-400" />
              Recent Earnings Results
            </h2>

            {recent.length === 0 ? (
              <EmptyState message="No recent earnings results in the database yet." />
            ) : (
              <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-950">
                {recent.map((e) => (
                  <Link
                    key={e.id}
                    href={`/company/${e.company.ticker}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-sm font-semibold text-emerald-400">
                          {e.company.ticker}
                        </span>
                        <span className="truncate text-sm text-zinc-300">{e.company.name}</span>
                      </div>
                      <div className="text-xs text-zinc-500">{formatDate(e.reportDate)}</div>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <div className="text-zinc-400">
                        EPS: <span className="text-white">{formatEPS(e.epsActual)}</span>
                      </div>
                      <div className={`text-xs font-medium ${surpriseColor(e.epsSurprisePct)}`}>
                        {e.epsSurprisePct != null ? formatPct(e.epsSurprisePct) : "—"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950 px-6 py-10 text-center">
      <p className="text-sm text-zinc-500">{message}</p>
      <p className="mt-1 text-xs text-zinc-600">
        Search for a company above to load its data.
      </p>
    </div>
  );
}
