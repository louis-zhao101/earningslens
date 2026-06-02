import numeral from "numeral";

export function formatCurrency(value: number | bigint | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "bigint" ? Number(value) : value;
  if (Math.abs(n) >= 1e9) return `$${numeral(n / 1e9).format("0.00")}B`;
  if (Math.abs(n) >= 1e6) return `$${numeral(n / 1e6).format("0.00")}M`;
  if (Math.abs(n) >= 1e3) return `$${numeral(n / 1e3).format("0.00")}K`;
  return `$${numeral(n).format("0.00")}`;
}

export function formatLargeNumber(value: number | bigint | null | undefined): string {
  if (value == null) return "—";
  const n = typeof value === "bigint" ? Number(value) : value;
  if (Math.abs(n) >= 1e12) return `${numeral(n / 1e12).format("0.00")}T`;
  if (Math.abs(n) >= 1e9) return `${numeral(n / 1e9).format("0.00")}B`;
  if (Math.abs(n) >= 1e6) return `${numeral(n / 1e6).format("0.00")}M`;
  if (Math.abs(n) >= 1e3) return `${numeral(n / 1e3).format("0.00")}K`;
  return numeral(n).format("0,0");
}

export function formatEPS(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${numeral(value).format("0.00")}`;
}

export function formatPct(value: number | null | undefined, includeSign = true): string {
  if (value == null) return "—";
  const sign = includeSign && value > 0 ? "+" : "";
  return `${sign}${numeral(value).format("0.00")}%`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function surpriseColor(pct: number | null | undefined): string {
  if (pct == null) return "text-zinc-400";
  if (pct > 0) return "text-emerald-400";
  if (pct < 0) return "text-red-400";
  return "text-zinc-400";
}

export function priceChangeColor(pct: number | null | undefined): string {
  if (pct == null) return "text-zinc-400";
  if (pct > 0) return "text-emerald-400";
  if (pct < 0) return "text-red-400";
  return "text-zinc-400";
}
