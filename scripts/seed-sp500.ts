import * as dotenv from "dotenv";
import * as path from "path";

// Must load env before any module that reads process.env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fmp } from "../src/lib/fmp";
import { SP500_TICKERS } from "./sp500-tickers";

const PRICE_FROM = "2021-01-01";
const DELAY_MS = 500; // 120 req/min — well within FMP Starter limits

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function quarterFromPeriod(period: string): number {
  const map: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
  return map[period] ?? 1;
}

async function seedCompany(ticker: string): Promise<void> {
  // 1. Profile
  const profiles = await fmp.profile(ticker);
  const profile = profiles[0];
  if (!profile) throw new Error(`No FMP profile`);

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

  // 2. Earnings
  const earnings = await fmp.earnings(ticker, 20);
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
        revenueSurprisePct: revSurprisePct,
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
        revenueSurprisePct: revSurprisePct,
        isConfirmed: e.epsActual != null,
        isUpcoming: reportDate > new Date(),
      },
    });
  }

  // 3. Financials
  const [incomeStmts, cashFlows, balanceSheets] = await Promise.all([
    fmp.incomeStatement(ticker, "quarter", 20),
    fmp.cashFlow(ticker, "quarter", 20),
    fmp.balanceSheet(ticker, "quarter", 20),
  ]);

  const cashFlowMap = new Map(cashFlows.map((c) => [c.date, c]));
  const balanceSheetMap = new Map(balanceSheets.map((b) => [b.date, b]));

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
  }

  // 4. Historical prices — chunked batch insert for speed
  const prices = await fmp.historicalPrices(ticker, PRICE_FROM);
  if (prices && prices.length > 0) {
    const data = prices.map((p) => ({
      companyId: company.id,
      date: new Date(p.date),
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: BigInt(Math.round(p.volume)),
      adjClose: p.close,
    }));

    const CHUNK = 500;
    for (let i = 0; i < data.length; i += CHUNK) {
      await prisma.stockPrice.createMany({
        data: data.slice(i, i + CHUNK),
        skipDuplicates: true,
      });
    }
  }
}

async function main() {
  const tickers = SP500_TICKERS;
  console.log(`Seeding ${tickers.length} S&P 500 companies from ${PRICE_FROM}...\n`);

  const failed: string[] = [];

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    process.stdout.write(`[${String(i + 1).padStart(3)}/${tickers.length}] ${ticker.padEnd(6)}`);

    try {
      await seedCompany(ticker);
      process.stdout.write(" ✓\n");
    } catch (err) {
      const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
      process.stdout.write(` ✗ ${msg}\n`);
      failed.push(ticker);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n--- Done ---`);
  console.log(`Succeeded: ${tickers.length - failed.length}`);
  if (failed.length > 0) {
    console.log(`Failed (${failed.length}): ${failed.join(", ")}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
