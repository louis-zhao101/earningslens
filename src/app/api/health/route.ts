import { prisma } from "@/lib/prisma";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;

  try {
    const [companies, earnings] = await Promise.all([
      prisma.company.count(),
      prisma.earningsEvent.count(),
    ]);
    return Response.json({ ok: true, companies, earnings, dbUrl: dbUrl ? "set" : "missing" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: message, dbUrl: dbUrl ? "set" : "missing" }, { status: 500 });
  }
}
