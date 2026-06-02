import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncCompany } from "@/lib/sync";
import { bust } from "@/lib/redis";

export const maxDuration = 300;

// GET /api/cron/refresh
// Called daily by Vercel cron. Protected by CRON_SECRET header.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` || !process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companies = await prisma.company.findMany({ select: { ticker: true } });

  const results: { ticker: string; ok: boolean; error?: string }[] = [];
  for (const { ticker } of companies) {
    try {
      await syncCompany(ticker);
      await bust(
        `company:${ticker}:earnings`,
        `company:${ticker}:financials`,
        `company:${ticker}:prices`,
      );
      results.push({ ticker, ok: true });
    } catch (err) {
      results.push({ ticker, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  await bust("home:upcoming", "home:recent", "calendar");

  return Response.json({ refreshed: results.length, results });
}
