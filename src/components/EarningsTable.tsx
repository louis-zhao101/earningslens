import { formatDate, formatEPS, formatCurrency, formatPct, surpriseColor, priceChangeColor } from "@/lib/format";
import type { EarningsEvent } from "@prisma/client";

interface Props {
  events: EarningsEvent[];
}

export default function EarningsTable({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">
        No earnings history available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
            <th className="pb-3 pr-4">Date</th>
            <th className="pb-3 pr-4">Period</th>
            <th className="pb-3 pr-4 text-right">EPS Est.</th>
            <th className="pb-3 pr-4 text-right">EPS Actual</th>
            <th className="pb-3 pr-4 text-right">EPS Surprise</th>
            <th className="pb-3 pr-4 text-right">Rev. Est.</th>
            <th className="pb-3 pr-4 text-right">Rev. Actual</th>
            <th className="pb-3 text-right">Rev. Surprise</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {events.map((e) => (
            <tr key={e.id} className="group transition-colors hover:bg-zinc-800/30">
              <td className="py-3 pr-4 font-medium text-white">
                {formatDate(e.reportDate)}
                {e.callTime && (
                  <span className="ml-2 text-[10px] text-zinc-600 uppercase">{e.callTime}</span>
                )}
              </td>
              <td className="py-3 pr-4 text-zinc-400">
                {e.fiscalQuarter ? `Q${e.fiscalQuarter} ${e.fiscalYear}` : e.fiscalPeriod}
              </td>
              <td className="py-3 pr-4 text-right text-zinc-400">{formatEPS(e.epsEstimate)}</td>
              <td className="py-3 pr-4 text-right font-medium text-white">
                {e.epsActual != null ? formatEPS(e.epsActual) : <span className="text-zinc-600">—</span>}
              </td>
              <td className={`py-3 pr-4 text-right font-medium ${surpriseColor(e.epsSurprisePct)}`}>
                {e.epsSurprisePct != null ? formatPct(e.epsSurprisePct) : "—"}
              </td>
              <td className="py-3 pr-4 text-right text-zinc-400">
                {formatCurrency(e.revenueEstimate)}
              </td>
              <td className="py-3 pr-4 text-right font-medium text-white">
                {e.revenueActual != null ? formatCurrency(e.revenueActual) : <span className="text-zinc-600">—</span>}
              </td>
              <td className={`py-3 text-right font-medium ${surpriseColor(e.revenueSurprisePct)}`}>
                {e.revenueSurprisePct != null ? formatPct(e.revenueSurprisePct) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { priceChangeColor };
