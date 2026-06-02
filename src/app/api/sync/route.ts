import { NextRequest } from "next/server";
import { syncCompany } from "@/lib/sync";

// POST /api/sync?ticker=AAPL&secret=...
export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET || !process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticker = request.nextUrl.searchParams.get("ticker")?.toUpperCase();
  if (!ticker) return Response.json({ error: "ticker required" }, { status: 400 });

  try {
    const result = await syncCompany(ticker);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
