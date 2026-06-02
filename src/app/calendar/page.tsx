import { prisma } from "@/lib/prisma";
import { formatDate, formatEPS, formatPct, surpriseColor } from "@/lib/format";
import Link from "next/link";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Earnings Calendar — EarningsLens",
};

async function getCalendarEvents() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAhead = new Date();
  sixtyDaysAhead.setDate(sixtyDaysAhead.getDate() + 60);

  return prisma.earningsEvent.findMany({
    where: {
      reportDate: { gte: thirtyDaysAgo, lte: sixtyDaysAhead },
    },
    include: {
      company: { select: { ticker: true, name: true, sector: true, marketCap: true } },
    },
    orderBy: { reportDate: "asc" },
  }).catch(() => []);
}

export default async function CalendarPage() {
  const events = await getCalendarEvents();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group by date
  type CalendarEvent = (typeof events)[number];
  const grouped = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.reportDate.toISOString().split("T")[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  }

  const sortedDates = [...grouped.keys()].sort();

  return (
    <div className="flex flex-col flex-1 bg-zinc-900">
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Calendar className="h-5 w-5 text-zinc-400" />
            Earnings Calendar
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Upcoming and recent earnings announcements — 30 days back, 60 days ahead.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        {sortedDates.length === 0 ? (
          <div className="py-20 text-center text-sm text-zinc-500">
            No earnings events in the database yet.
            <br />
            <span className="text-zinc-600">
              Search for a company to load its data.
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((dateKey) => {
              const dayEvents = grouped.get(dateKey)!;
              const date = new Date(dateKey + "T00:00:00");
              const isToday = date.toDateString() === today.toDateString();
              const isPast = date < today;

              return (
                <div key={dateKey}>
                  <div className="mb-2 flex items-center gap-3">
                    <h3
                      className={`text-sm font-semibold ${isToday ? "text-emerald-400" : isPast ? "text-zinc-500" : "text-white"}`}
                    >
                      {isToday ? "Today — " : ""}
                      {date.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                    <div className="h-px flex-1 bg-zinc-800" />
                    <span className="text-xs text-zinc-600">{dayEvents.length} companies</span>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                          <th className="px-4 py-2.5">Company</th>
                          <th className="px-4 py-2.5">Sector</th>
                          <th className="px-4 py-2.5 text-right">Time</th>
                          <th className="px-4 py-2.5 text-right">EPS Est.</th>
                          {isPast && <th className="px-4 py-2.5 text-right">EPS Actual</th>}
                          {isPast && <th className="px-4 py-2.5 text-right">Surprise</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {dayEvents.map((e) => (
                          <tr key={e.id} className="hover:bg-zinc-800/30">
                            <td className="px-4 py-3">
                              <Link
                                href={`/company/${e.company.ticker}`}
                                className="flex items-baseline gap-2 hover:underline"
                              >
                                <span className="font-mono font-semibold text-emerald-400">
                                  {e.company.ticker}
                                </span>
                                <span className="truncate text-zinc-300">{e.company.name}</span>
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-zinc-500">
                              {e.company.sector ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-right text-xs uppercase text-zinc-600">
                              {e.callTime ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-right text-zinc-400">
                              {formatEPS(e.epsEstimate)}
                            </td>
                            {isPast && (
                              <td className="px-4 py-3 text-right font-medium text-white">
                                {e.epsActual != null ? formatEPS(e.epsActual) : "—"}
                              </td>
                            )}
                            {isPast && (
                              <td
                                className={`px-4 py-3 text-right font-medium ${surpriseColor(e.epsSurprisePct)}`}
                              >
                                {e.epsSurprisePct != null ? formatPct(e.epsSurprisePct) : "—"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
