const BASE = "https://finnhub.io/api/v1";
const key = () => process.env.FINNHUB_API_KEY ?? "";

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("token", key());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Finnhub ${path} → ${res.status}`);
  return res.json();
}

export interface FinnhubEarning {
  date: string;
  symbol: string;
  hour: string; // "bmo" | "amc" | "dmh"
  year: number;
  quarter: number;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
}

export const finnhub = {
  earningsCalendar: (from: string, to: string) =>
    get<{ earningsCalendar: FinnhubEarning[] }>(`/calendar/earnings`, { from, to }),

  companyEarnings: (symbol: string, limit = 12) =>
    get<FinnhubEarning[]>(`/stock/earnings`, { symbol, limit: String(limit) }),
};
