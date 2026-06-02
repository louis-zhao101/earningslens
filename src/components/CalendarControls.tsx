"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  weekOffset: number;
  sectors: string[];
  selectedSector: string;
  weekLabel: string;
}

export default function CalendarControls({ weekOffset, sectors, selectedSector, weekLabel }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(newWeek: number, newSector?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", String(newWeek));
    if (newSector !== undefined) {
      if (newSector) params.set("sector", newSector);
      else params.delete("sector");
    }
    router.push(`/calendar?${params.toString()}`);
  }

  function onSectorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate(weekOffset, e.target.value);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Week navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(weekOffset - 1)}
          className="flex items-center gap-1 rounded px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <button
          onClick={() => navigate(0)}
          disabled={weekOffset === 0}
          className="rounded px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-default"
        >
          Today
        </button>
        <button
          onClick={() => navigate(weekOffset + 1)}
          className="flex items-center gap-1 rounded px-2 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <span className="text-sm font-medium text-white">{weekLabel}</span>

      <div className="ml-auto">
        <select
          value={selectedSector}
          onChange={onSectorChange}
          className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
