const BASE = "https://financialmodelingprep.com/stable";
const key = () => {
  const k = process.env.FMP_API_KEY;
  if (!k) throw new Error("FMP_API_KEY is not set");
  return k;
};

async function get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("apikey", key());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`FMP ${path} → ${res.status}`);
  return res.json();
}

export interface FMPProfile {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  marketCap: number;
  exchange: string;
  exchangeFullName: string;
  description: string;
  website: string;
  fullTimeEmployees: string;
  country: string;
  image: string;
  ceo: string;
  ipoDate: string;
}

export interface FMPEarnings {
  symbol: string;
  date: string;
  epsActual: number | null;
  epsEstimated: number | null;
  revenueActual: number | null;
  revenueEstimated: number | null;
  lastUpdated: string;
}

export interface FMPIncomeStatement {
  date: string;
  symbol: string;
  period: string;       // "Q1", "Q2", "Q3", "Q4", "FY"
  fiscalYear: string;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  epsDiluted: number;
  ebitda: number;
}

export interface FMPBalanceSheet {
  date: string;
  period: string;
  fiscalYear: string;
  totalAssets: number;
  totalDebt: number;
}

export interface FMPCashFlow {
  date: string;
  period: string;
  fiscalYear: string;
  freeCashFlow: number;
  operatingCashFlow: number;
}

export interface FMPPrice {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  vwap: number;
}

export interface FMPSearchResult {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  exchangeFullName: string;
}

export const fmp = {
  profile: (ticker: string) =>
    get<FMPProfile[]>(`/profile`, { symbol: ticker }),

  searchSymbol: (query: string, limit = 10) =>
    get<FMPSearchResult[]>(`/search-symbol`, { query, limit: String(limit) }),

  searchName: (query: string, limit = 10) =>
    get<FMPSearchResult[]>(`/search-name`, { query, limit: String(limit) }),

  earnings: (ticker: string, limit = 20) =>
    get<FMPEarnings[]>(`/earnings`, { symbol: ticker, limit: String(limit) }),

  earningsCalendar: (from: string, to: string) =>
    get<FMPEarnings[]>(`/earnings-calendar`, { from, to }),

  incomeStatement: (ticker: string, period: "annual" | "quarter" = "quarter", limit = 12) =>
    get<FMPIncomeStatement[]>(`/income-statement`, {
      symbol: ticker,
      period,
      limit: String(limit),
    }),

  balanceSheet: (ticker: string, period: "annual" | "quarter" = "quarter", limit = 12) =>
    get<FMPBalanceSheet[]>(`/balance-sheet-statement`, {
      symbol: ticker,
      period,
      limit: String(limit),
    }),

  cashFlow: (ticker: string, period: "annual" | "quarter" = "quarter", limit = 12) =>
    get<FMPCashFlow[]>(`/cash-flow-statement`, {
      symbol: ticker,
      period,
      limit: String(limit),
    }),

  historicalPrices: (ticker: string, from?: string, to?: string) =>
    get<FMPPrice[]>(`/historical-price-eod/full`, {
      symbol: ticker,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }),
};
