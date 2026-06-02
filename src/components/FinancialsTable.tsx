import { formatCurrency, formatEPS } from "@/lib/format";
import type { FinancialStatement } from "@prisma/client";

type FinancialValue = number | bigint | null | undefined;

interface Row {
  label: string;
  key: keyof FinancialStatement;
  format: (v: FinancialValue) => string;
}

interface Props {
  statements: FinancialStatement[];
}

export default function FinancialsTable({ statements }: Props) {
  if (statements.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">
        No financial data available.
      </div>
    );
  }

  const rows: Row[] = [
    { label: "Revenue", key: "revenue", format: formatCurrency },
    { label: "Gross Profit", key: "grossProfit", format: formatCurrency },
    { label: "Operating Income", key: "operatingIncome", format: formatCurrency },
    { label: "Net Income", key: "netIncome", format: formatCurrency },
    { label: "EBITDA", key: "ebitda", format: formatCurrency },
    { label: "EPS", key: "eps", format: (v) => formatEPS(v as number | null) },
    { label: "Free Cash Flow", key: "freeCashFlow", format: formatCurrency },
    { label: "Total Assets", key: "totalAssets", format: formatCurrency },
    { label: "Total Debt", key: "totalDebt", format: formatCurrency },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-left">
            <th className="pb-3 pr-6 text-xs font-medium uppercase tracking-wider text-zinc-500 w-36">
              Metric
            </th>
            {statements.map((s) => (
              <th
                key={`${s.fiscalYear}-${s.fiscalQuarter}`}
                className="pb-3 pr-4 text-right text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                {s.fiscalQuarter ? `Q${s.fiscalQuarter} ${s.fiscalYear}` : String(s.fiscalYear)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {rows.map(({ label, key, format }) => (
            <tr key={label} className="hover:bg-zinc-800/30">
              <td className="py-2.5 pr-6 text-zinc-400">{label}</td>
              {statements.map((s) => {
                const val = s[key] as FinancialValue;
                return (
                  <td
                    key={`${s.fiscalYear}-${s.fiscalQuarter}-${label}`}
                    className="py-2.5 pr-4 text-right font-medium text-white"
                  >
                    {val != null ? format(val) : <span className="text-zinc-600">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
