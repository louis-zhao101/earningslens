import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/redis";
import { formatEPS, formatPct, formatLargeNumber, surpriseColor } from "@/lib/format";
import Link from "next/link";
import { Calendar } from "lucide-react";
import type { Metadata } from "next";
import CalendarControls from "@/components/CalendarControls";

export const metadata: Metadata = {
  title: "Earnings Calendar — EarningsLens",
};

interface Props {
  searchParams: Promise<{ sector?: string; week?: string }>;
}

function getWeekRange(weekOffset: number): { weekStart: Date; weekEnd: Date; weekLabel: string } {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekLabel =
    weekOffset === 0
      ? `This Week · ${fmt(monday)} – ${fmt(sunday)}`
      : weekOffset === -1
      ? `Last Week · ${fmt(monday)} – ${fmt(sunday)}`
      : weekOffset === 1
      ? `Next Week · ${fmt(monday)} – ${fmt(sunday)}`
      : `${fmt(monday)} – ${fmt(sunday)}`;

  return { weekStart: monday, weekEnd: sunday, weekLabel };
}


function surpriseBorderClass(pct: number | null | undefined): string {
  if (pct == null) return "border-l-2 border-l-zinc-800";
  if (pct >= 10)  return "border-l-2 border-l-emerald-400";
  if (pct >= 3)   return "border-l-2 border-l-emerald-600";
  if (pct >= 0)   return "border-l-2 border-l-emerald-900";
  if (pct >= -3)  return "border-l-2 border-l-red-900";
  if (pct >= -10) return "border-l-2 border-l-red-600";
  return "border-l-2 border-l-red-400";
}

async function getCalendarEvents(weekStart: Date, weekEnd: Date, sector: string) {
  const cacheKey = `calendar:${weekStart.toISOString().split("T")[0]}:${weekEnd.toISOString().split("T")[0]}:${sector}`;
  return cached(cacheKey, 1800, () =>
    prisma.earningsEvent.findMany({
      where: {
        reportDate: { gte: weekStart, lte: weekEnd },
        ...(sector ? { company: { sector } } : {}),
      },
      include: {
        company: { select: { ticker: true, name: true, sector: true, marketCap: true } },
      },
      orderBy: [
        { reportDate: "asc" },
        { company: { marketCap: "desc" } },
      ],
    }).catch(() => [])
  );
}

async function getDistinctSectors(): Promise<string[]> {
  const rows = await prisma.company.findMany({
    where: { sector: { not: null } },
    select: { sector: true },
    distinct: ["sector"],
    orderBy: { sector: "asc" },
  }).catch(() => []);
  return rows.map((r) => r.sector!).filter(Boolean);
}

export default async function CalendarPage({ searchParams }: Props) {
  const { sector = "", week = "0" } = await searchParams;
  const weekOffset = parseInt(week) || 0;
  const { weekStart, weekEnd, weekLabel } = getWeekRange(weekOffset);

  const [events, sectors] = await Promise.all([
    getCalendarEvents(weekStart, weekEnd, sector),
    getDistinctSectors(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group by date
  type CalendarEvent = (typeof events)[number];
  const grouped = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = e.reportDate.toISOString
      ? e.reportDate.toISOString().split("T")[0]
      : String(e.reportDate).split("T")[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  }
  const sortedDates = [...grouped.keys()].sort();

  // Summary stats
  const uniqueSectors = new Set(events.map((e) => e.company.sector).filter(Boolean));
  const sectorCounts = new Map<string, number>();
  for (const e of events) {
    if (e.company.sector) sectorCounts.set(e.company.sector, (sectorCounts.get(e.company.sector) ?? 0) + 1);
  }
  const topSectors = [...sectorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="flex flex-col flex-1 bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-zinc-400" />
            <h1 className="text-lg font-semibold text-white">Earnings Calendar</h1>
          </div>
          <CalendarControls
            weekOffset={weekOffset}
            sectors={sectors}
            selectedSector={sector}
            weekLabel={weekLabel}
          />
        </div>
      </div>

      {/* Summary bar */}
      {events.length > 0 && (
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-zinc-500">
            <span>
              <span className="font-semibold text-zinc-300">{events.length}</span> companies
              {" · "}
              <span className="font-semibold text-zinc-300">{uniqueSectors.size}</span> sectors
            </span>
            {topSectors.map(([s, count]) => (
              <span key={s}>
                {s}: <span className="text-zinc-400">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        {sortedDates.length === 0 ? (
          <div className="py-20 text-center text-sm text-zinc-500">
            No earnings events for this week.
            <br />
            <span className="text-zinc-600">Try navigating to another week or clearing the sector filter.</span>
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
                    <h3 className={`text-sm font-semibold ${isToday ? "text-emerald-400" : isPast ? "text-zinc-500" : "text-white"}`}>
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
                          <th className="w-1 p-0" />
                          <th className="px-4 py-2.5">Company</th>
                          <th className="px-4 py-2.5">Sector</th>
                          <th className="px-4 py-2.5">Market Cap</th>
                          <th className="px-4 py-2.5 text-right">Time</th>
                          <th className="px-4 py-2.5 text-right">EPS Est.</th>
                          {isPast && <th className="px-4 py-2.5 text-right">EPS Act.</th>}
                          {isPast && <th className="px-4 py-2.5 text-right">EPS Surp.</th>}
                          <th className="px-4 py-2.5 text-right">Rev Est.</th>
                          {isPast && <th className="px-4 py-2.5 text-right">Rev Act.</th>}
                          {isPast && <th className="px-4 py-2.5 text-right">Rev Surp.</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {dayEvents.map((e) => {
                          const borderClass = isPast && e.isConfirmed
                            ? surpriseBorderClass(e.epsSurprisePct)
                            : "border-l-2 border-l-zinc-800";

                          return (
                            <tr key={e.id} className={`hover:bg-zinc-800/30 ${borderClass}`}>
                              <td className="w-1 p-0" />
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
                              <td className="px-4 py-3 text-zinc-500 text-xs">
                                {e.company.sector ?? "—"}
                              </td>
                              <td className="px-4 py-3 text-xs text-zinc-400">
                                {e.company.marketCap != null ? formatLargeNumber(e.company.marketCap) : "—"}
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
                                <td className={`px-4 py-3 text-right font-medium ${surpriseColor(e.epsSurprisePct)}`}>
                                  {e.epsSurprisePct != null ? formatPct(e.epsSurprisePct) : "—"}
                                </td>
                              )}
                              <td className="px-4 py-3 text-right text-zinc-400">
                                {e.revenueEstimate != null ? formatLargeNumber(e.revenueEstimate) : "—"}
                              </td>
                              {isPast && (
                                <td className="px-4 py-3 text-right font-medium text-white">
                                  {e.revenueActual != null ? formatLargeNumber(e.revenueActual) : "—"}
                                </td>
                              )}
                              {isPast && (
                                <td className={`px-4 py-3 text-right font-medium ${surpriseColor(e.revenueSurprisePct)}`}>
                                  {e.revenueSurprisePct != null ? formatPct(e.revenueSurprisePct) : "—"}
                                </td>
                              )}
                            </tr>
                          );
                        })}
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
