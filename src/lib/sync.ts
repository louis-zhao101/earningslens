import { fmp } from "@/lib/fmp";
import { prisma } from "@/lib/prisma";

function quarterFromPeriod(period: string): number {
  const map: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
  return map[period] ?? 1;
}

export async function syncCompany(ticker: string): Promise<{ ticker: string; earnings: number; financials: number; prices: number }> {
  const profiles = await fmp.profile(ticker);
  const profile = profiles[0];
  if (!profile) throw new Error(`No FMP profile for ${ticker}`);

  const company = await prisma.company.upsert({
    where: { ticker },
    create: {
      ticker,
      name: profile.companyName,
      sector: profile.sector || null,
      industry: profile.industry || null,
      marketCap: profile.marketCap ? BigInt(Math.round(profile.marketCap)) : null,
      exchange: profile.exchange || null,
      description: profile.description || null,
      website: profile.website || null,
      employees: profile.fullTimeEmployees ? parseInt(profile.fullTimeEmployees) : null,
      country: profile.country || "US",
      logo: profile.image || null,
      ceo: profile.ceo || null,
      ipoDate: profile.ipoDate ? new Date(profile.ipoDate) : null,
    },
    update: {
      name: profile.companyName,
      sector: profile.sector || null,
      industry: profile.industry || null,
      marketCap: profile.marketCap ? BigInt(Math.round(profile.marketCap)) : null,
      exchange: profile.exchange || null,
      description: profile.description || null,
      website: profile.website || null,
      employees: profile.fullTimeEmployees ? parseInt(profile.fullTimeEmployees) : null,
      logo: profile.image || null,
      ceo: profile.ceo || null,
    },
  });

  const earnings = await fmp.earnings(ticker, 20);
  let earningsCount = 0;
  for (const e of earnings) {
    const reportDate = new Date(e.date);
    const epsSurprise =
      e.epsActual != null && e.epsEstimated != null ? e.epsActual - e.epsEstimated : null;
    const epsSurprisePct =
      epsSurprise != null && e.epsEstimated !== 0
        ? (epsSurprise / Math.abs(e.epsEstimated!)) * 100
        : null;
    const revSurprise =
      e.revenueActual != null && e.revenueEstimated != null
        ? e.revenueActual - e.revenueEstimated
        : null;
    const revSurprisePct =
      revSurprise != null && e.revenueEstimated !== 0
        ? (revSurprise / Math.abs(e.revenueEstimated!)) * 100
        : null;

    const id = `${company.id}-${e.date}`;
    await prisma.earningsEvent.upsert({
      where: { id },
      create: {
        id,
        companyId: company.id,
        reportDate,
        fiscalPeriod: e.date,
        epsEstimate: e.epsEstimated,
        epsActual: e.epsActual,
        epsSurprise,
        epsSurprisePct,
        revenueEstimate: e.revenueEstimated ? BigInt(Math.round(e.revenueEstimated)) : null,
        revenueActual: e.revenueActual ? BigInt(Math.round(e.revenueActual)) : null,
        revenueSurprise: revSurprise ? BigInt(Math.round(revSurprise)) : null,
        revenueSurprisePct,
        isConfirmed: e.epsActual != null,
        isUpcoming: reportDate > new Date(),
      },
      update: {
        epsActual: e.epsActual,
        epsEstimate: e.epsEstimated,
        epsSurprise,
        epsSurprisePct,
        revenueEstimate: e.revenueEstimated ? BigInt(Math.round(e.revenueEstimated)) : null,
        revenueActual: e.revenueActual ? BigInt(Math.round(e.revenueActual)) : null,
        revenueSurprise: revSurprise ? BigInt(Math.round(revSurprise)) : null,
        revenueSurprisePct,
        isConfirmed: e.epsActual != null,
        isUpcoming: reportDate > new Date(),
      },
    });
    earningsCount++;
  }

  const [incomeStmts, cashFlows, balanceSheets] = await Promise.all([
    fmp.incomeStatement(ticker, "quarter", 12),
    fmp.cashFlow(ticker, "quarter", 12),
    fmp.balanceSheet(ticker, "quarter", 12),
  ]);

  const cashFlowMap = new Map(cashFlows.map((c) => [c.date, c]));
  const balanceSheetMap = new Map(balanceSheets.map((b) => [b.date, b]));

  let financialsCount = 0;
  for (const stmt of incomeStmts) {
    const cf = cashFlowMap.get(stmt.date);
    const bs = balanceSheetMap.get(stmt.date);
    const fiscalYear = parseInt(stmt.fiscalYear);
    const fiscalQuarter = quarterFromPeriod(stmt.period);

    await prisma.financialStatement.upsert({
      where: {
        companyId_period_fiscalYear_fiscalQuarter: {
          companyId: company.id,
          period: "quarter",
          fiscalYear,
          fiscalQuarter,
        },
      },
      create: {
        companyId: company.id,
        period: "quarter",
        fiscalYear,
        fiscalQuarter,
        revenue: stmt.revenue ? BigInt(Math.round(stmt.revenue)) : null,
        grossProfit: stmt.grossProfit ? BigInt(Math.round(stmt.grossProfit)) : null,
        operatingIncome: stmt.operatingIncome ? BigInt(Math.round(stmt.operatingIncome)) : null,
        netIncome: stmt.netIncome ? BigInt(Math.round(stmt.netIncome)) : null,
        eps: stmt.epsDiluted || stmt.eps || null,
        ebitda: stmt.ebitda ? BigInt(Math.round(stmt.ebitda)) : null,
        totalAssets: bs?.totalAssets ? BigInt(Math.round(bs.totalAssets)) : null,
        totalDebt: bs?.totalDebt ? BigInt(Math.round(bs.totalDebt)) : null,
        freeCashFlow: cf?.freeCashFlow ? BigInt(Math.round(cf.freeCashFlow)) : null,
        reportedDate: new Date(stmt.date),
      },
      update: {
        revenue: stmt.revenue ? BigInt(Math.round(stmt.revenue)) : null,
        grossProfit: stmt.grossProfit ? BigInt(Math.round(stmt.grossProfit)) : null,
        operatingIncome: stmt.operatingIncome ? BigInt(Math.round(stmt.operatingIncome)) : null,
        netIncome: stmt.netIncome ? BigInt(Math.round(stmt.netIncome)) : null,
        eps: stmt.epsDiluted || stmt.eps || null,
        ebitda: stmt.ebitda ? BigInt(Math.round(stmt.ebitda)) : null,
        totalAssets: bs?.totalAssets ? BigInt(Math.round(bs.totalAssets)) : null,
        totalDebt: bs?.totalDebt ? BigInt(Math.round(bs.totalDebt)) : null,
        freeCashFlow: cf?.freeCashFlow ? BigInt(Math.round(cf.freeCashFlow)) : null,
      },
    });
    financialsCount++;
  }

  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const prices = await fmp.historicalPrices(ticker, twoYearsAgo.toISOString().split("T")[0]);

  let priceCount = 0;
  for (const p of prices ?? []) {
    await prisma.stockPrice.upsert({
      where: { companyId_date: { companyId: company.id, date: new Date(p.date) } },
      create: {
        companyId: company.id,
        date: new Date(p.date),
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: BigInt(Math.round(p.volume)),
        adjClose: p.close,
      },
      update: {
        close: p.close,
        volume: BigInt(Math.round(p.volume)),
      },
    });
    priceCount++;
  }

  return { ticker, earnings: earningsCount, financials: financialsCount, prices: priceCount };
}
