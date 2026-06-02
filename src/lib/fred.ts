const BASE = "https://api.stlouisfed.org/fred";
const key = () => process.env.FRED_API_KEY ?? "";

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", key());
  url.searchParams.set("file_type", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`FRED ${path} → ${res.status}`);
  return res.json();
}

export interface FREDObservation {
  date: string;
  value: string;
}

export interface FREDSeries {
  id: string;
  title: string;
  units: string;
  frequency: string;
}

// Common macro series IDs
export const FRED_SERIES = {
  GDP: { id: "GDP", label: "Real GDP", unit: "Billions of Chained 2017 Dollars" },
  CPI: { id: "CPIAUCSL", label: "CPI (All Urban Consumers)", unit: "Index" },
  FEDFUNDS: { id: "FEDFUNDS", label: "Federal Funds Rate", unit: "%" },
  UNRATE: { id: "UNRATE", label: "Unemployment Rate", unit: "%" },
  T10Y2Y: { id: "T10Y2Y", label: "10Y-2Y Treasury Spread", unit: "%" },
} as const;

export const fred = {
  observations: (seriesId: string, limit = 20) =>
    get<{ observations: FREDObservation[] }>(`/series/observations`, {
      series_id: seriesId,
      sort_order: "desc",
      limit: String(limit),
    }),

  series: (seriesId: string) =>
    get<{ seriess: FREDSeries[] }>(`/series`, { series_id: seriesId }),
};
