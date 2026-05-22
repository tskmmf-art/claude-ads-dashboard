"use client";

import * as React from "react";
import type { AdMetrics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRoas,
} from "@/lib/utils/formatters";

type SortKey =
  | "spend"
  | "impressions"
  | "clicks"
  | "conversions"
  | "ctr"
  | "cpc"
  | "roas";

const PLATFORM_COLORS: Record<string, string> = {
  meta: "bg-blue-100 text-blue-800",
  google: "bg-green-100 text-green-800",
  linkedin: "bg-sky-100 text-sky-800",
};

interface Props {
  data: AdMetrics[];
  isLoading: boolean;
}

export function CampaignTable({ data, isLoading }: Props) {
  const [sortKey, setSortKey] = React.useState<SortKey>("spend");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = [...data].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === "asc" ? diff : -diff;
  });

  const maxSpend = Math.max(...sorted.map((r) => r.spend), 1);

  const cols: { key: SortKey; label: string; format: (v: number) => string }[] =
    [
      { key: "spend", label: "Forbrug", format: formatCurrency },
      { key: "impressions", label: "Visninger", format: formatNumber },
      { key: "clicks", label: "Klik", format: formatNumber },
      { key: "conversions", label: "Conv.", format: formatNumber },
      { key: "ctr", label: "CTR", format: formatPercent },
      { key: "cpc", label: "CPC", format: formatCurrency },
      { key: "roas", label: "ROAS", format: formatRoas },
    ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Kampagner</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        {isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            Ingen kampagner at vise.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Platform
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Kampagne
                </th>
                {cols.map((c) => (
                  <th
                    key={c.key}
                    className="cursor-pointer px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground select-none"
                    onClick={() => handleSort(c.key)}
                  >
                    {c.label}
                    {sortKey === c.key && (
                      <span className="ml-1">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => {
                const spendPct = (row.spend / maxSpend) * 100;
                return (
                  <tr
                    key={`${row.platform}-${row.campaignId}-${i}`}
                    className="border-b transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PLATFORM_COLORS[row.platform] ?? ""}`}
                      >
                        {row.platform}
                      </span>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium">
                      {row.campaignName}
                    </td>
                    {cols.map((c) => (
                      <td
                        key={c.key}
                        className="px-4 py-3 text-right tabular-nums"
                      >
                        {c.key === "spend" ? (
                          <div className="relative flex items-center justify-end">
                            <div
                              className="absolute inset-y-0 left-0 rounded-sm bg-blue-100"
                              style={{ width: `${spendPct}%`, opacity: 0.6 }}
                            />
                            <span className="relative font-medium">
                              {formatCurrency(row.spend)}
                            </span>
                          </div>
                        ) : (
                          c.format(row[c.key])
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
