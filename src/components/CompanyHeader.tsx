import Image from "next/image";
import { Building2, Globe, Users } from "lucide-react";
import { formatLargeNumber } from "@/lib/format";
import type { Company } from "@prisma/client";

export default function CompanyHeader({ company }: { company: Company }) {
  return (
    <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start gap-4">
          {company.logo && (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
              <Image
                src={company.logo}
                alt={company.name}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-xl font-semibold text-white">{company.name}</h1>
              <span className="font-mono text-sm font-semibold text-emerald-400">
                {company.ticker}
              </span>
              {company.exchange && (
                <span className="text-xs text-zinc-500">{company.exchange}</span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
              {company.sector && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {company.sector}
                  {company.industry && ` · ${company.industry}`}
                </span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              {company.employees && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {formatLargeNumber(company.employees)} employees
                </span>
              )}
            </div>
          </div>

          {company.marketCap && (
            <div className="shrink-0 text-right">
              <div className="text-xs text-zinc-500">Market Cap</div>
              <div className="text-base font-semibold text-white">
                {formatLargeNumber(company.marketCap)}
              </div>
            </div>
          )}
        </div>

        {company.description && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400 line-clamp-3">
            {company.description}
          </p>
        )}
      </div>
    </div>
  );
}
