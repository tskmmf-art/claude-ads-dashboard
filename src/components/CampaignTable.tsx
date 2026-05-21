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

  const cols: { key: SortKey; label: string; format: (v: number) => string }[] =
    [
      { key: "spend", label: "Spend", format: formatCurrency },
      { key: "impressions", label: "Impressions", format: formatNumber },
      { key: "clicks", label: "Clicks", format: formatNumber },
      { key: "conversions", label: "Conv.", format: formatNumber },
      { key: "ctr", label: "CTR", format: formatPercent },
      { key: "cpc", label: "CPC", format: formatCurrency },
      { key: "roas", label: "ROAS", format: formatRoas },
    ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kampagnerne</CardTitle>
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
            No campaigns to display.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Platform
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Campaign
                </th>
                {cols.map((c) => (
                  <th
                    key={c.key}
                    className="cursor-pointer px-4 py-3 text-right font-medium text-muted-foreground hover:text-foreground"
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
              {sorted.map((row, i) => (
                <tr
                  key={`${row.platform}-${row.campaignId}-${i}`}
                  className="border-b transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PLATFORM_COLORS[row.platform] ?? ""}`}
                    >
                      {row.platform}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium">
                    {row.campaignName}
                  </td>
                  {cols.map((c) => (
                    <td
                      key={c.key}
                      className="px-4 py-3 text-right tabular-nums"
                    >
                      {c.format(row[c.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
