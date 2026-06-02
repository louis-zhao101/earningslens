import { NextRequest } from "next/server";
import { fmp } from "@/lib/fmp";
import { prisma } from "@/lib/prisma";
import { cached } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 1) {
    return Response.json({ results: [] });
  }

  // Check DB first for exact ticker match
  const dbCompany = await prisma.company.findUnique({
    where: { ticker: q.toUpperCase() },
    select: { ticker: true, name: true, sector: true, exchange: true },
  }).catch(() => null);

  if (dbCompany) {
    return Response.json({ results: [dbCompany] });
  }

  // Fall back to FMP search (symbol first, then name), cached 15 min
  try {
    const results = await cached(`search:${q.toLowerCase()}`, 900, async () => {
      const [bySymbol, byName] = await Promise.all([
        fmp.searchSymbol(q, 8),
        fmp.searchName(q, 5),
      ]);
      const seen = new Set<string>();
      const merged = [...bySymbol, ...byName].filter((r) => {
        if (seen.has(r.symbol) || !r.exchange.includes("NASDAQ") && !r.exchange.includes("NYSE")) return false;
        seen.add(r.symbol);
        return true;
      });
      return merged.slice(0, 8).map((r) => ({
        ticker: r.symbol,
        name: r.name,
        sector: null,
        exchange: r.exchange,
      }));
    });
    return Response.json({ results });
  } catch {
    return Response.json({ results: [], error: "Search unavailable" }, { status: 503 });
  }
}
