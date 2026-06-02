import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncCompany } from "@/lib/sync";
import CompanyHeader from "@/components/CompanyHeader";
import EarningsTable from "@/components/EarningsTable";
import FinancialsTable from "@/components/FinancialsTable";
import StockChart from "@/components/StockChart";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params;
  const company = await getCompany(ticker.toUpperCase());
  if (!company) return { title: `${ticker.toUpperCase()} — EarningsLens` };
  return { title: `${company.name} (${company.ticker}) — EarningsLens` };
}

async function getCompany(ticker: string) {
  return prisma.company.findUnique({
    where: { ticker },
  }).catch(() => null);
}

async function getEarnings(companyId: string) {
  return prisma.earningsEvent.findMany({
    where: { companyId },
    orderBy: { reportDate: "desc" },
    take: 20,
  }).catch(() => []);
}

async function getFinancials(companyId: string) {
  return prisma.financialStatement.findMany({
    where: { companyId, period: "quarter" },
    orderBy: [{ fiscalYear: "desc" }, { fiscalQuarter: "desc" }],
    take: 8,
  }).catch(() => []);
}

async function getPrices(companyId: string) {
  return prisma.stockPrice.findMany({
    where: { companyId },
    orderBy: { date: "asc" },
    select: { date: true, open: true, high: true, low: true, close: true },
  }).catch(() => []);
}

export default async function CompanyPage({ params }: Props) {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();

  let company = await getCompany(upper);
  if (!company) {
    try {
      await syncCompany(upper);
      company = await getCompany(upper);
    } catch {
      // FMP had no data for this ticker
    }
  }
  if (!company) notFound();

  const [earnings, financials, prices] = await Promise.all([
    getEarnings(company.id),
    getFinancials(company.id),
    getPrices(company.id),
  ]);

  const candles = prices.map((p: { date: Date; open: number; high: number; low: number; close: number }) => ({
    time: p.date.toISOString().split("T")[0],
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
  }));

  const earningsMarkers = earnings
    .filter((e) => e.isConfirmed)
    .map((e) => ({
      time: e.reportDate.toISOString().split("T")[0],
      beat: e.epsSurprisePct != null ? e.epsSurprisePct > 0 : null,
    }));

  return (
    <div className="flex flex-col flex-1 bg-zinc-900">
      <CompanyHeader company={company} />

      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8">
        {/* Stock chart */}
        <section>
          <h2 className="mb-4 text-sm font-semibold text-white">Price History</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <StockChart candles={candles} earningsMarkers={earningsMarkers} />
          </div>
        </section>

        {/* Earnings history */}
        <section>
          <h2 className="mb-4 text-sm font-semibold text-white">Earnings History</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <EarningsTable events={earnings} />
          </div>
        </section>

        {/* Financials */}
        <section>
          <h2 className="mb-4 text-sm font-semibold text-white">Quarterly Financials</h2>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <FinancialsTable statements={financials} />
          </div>
        </section>

        {/* Company info */}
        {(company.ceo || company.ipoDate || company.country) && (
          <section>
            <h2 className="mb-4 text-sm font-semibold text-white">Company Info</h2>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
                {company.ceo && (
                  <div>
                    <dt className="text-zinc-500">CEO</dt>
                    <dd className="mt-0.5 font-medium text-white">{company.ceo}</dd>
                  </div>
                )}
                {company.country && (
                  <div>
                    <dt className="text-zinc-500">Country</dt>
                    <dd className="mt-0.5 font-medium text-white">{company.country}</dd>
                  </div>
                )}
                {company.ipoDate && (
                  <div>
                    <dt className="text-zinc-500">IPO Date</dt>
                    <dd className="mt-0.5 font-medium text-white">
                      {company.ipoDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
