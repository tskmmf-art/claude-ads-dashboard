import type { KpiTotals } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber, formatPercent, formatRoas } from '@/lib/utils/formatters'

interface KpiCardProps {
  label: string
  value: string
  isLoading: boolean
  sub?: string
}

function KpiCard({ label, value, isLoading, sub }: KpiCardProps) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-28" />
      ) : (
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      )}
      {sub && !isLoading && (
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      )}
    </div>
  )
}

interface Props {
  totals: KpiTotals
  isLoading: boolean
  days: number
}

export function KpiCards({ totals, isLoading, days }: Props) {
  return (
    <div className="space-y-3">
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Impressions"
          value={formatNumber(totals.impressions)}
          isLoading={isLoading}
          sub={`Ø ${formatNumber(Math.round(totals.impressions / Math.max(days, 1)))} / dag`}
        />
        <KpiCard
          label="Klik"
          value={formatNumber(totals.clicks)}
          isLoading={isLoading}
          sub={`Ø ${formatNumber(Math.round(totals.clicks / Math.max(days, 1)))} / dag`}
        />
        <KpiCard
          label="Klik på link"
          value={formatNumber(totals.linkClicks)}
          isLoading={isLoading}
        />
        <KpiCard
          label="Gns. dagligt forbrug"
          value={formatCurrency(totals.avgDailySpend)}
          isLoading={isLoading}
          sub={`${days} dage i alt`}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Samlet forbrug"
          value={formatCurrency(totals.spend)}
          isLoading={isLoading}
        />
        <KpiCard
          label="CPM"
          value={formatCurrency(totals.cpm)}
          isLoading={isLoading}
          sub="pr. 1.000 visninger"
        />
        <KpiCard
          label="CPC"
          value={formatCurrency(totals.cpc)}
          isLoading={isLoading}
          sub="pr. klik"
        />
        <KpiCard
          label="CTR"
          value={formatPercent(totals.ctr)}
          isLoading={isLoading}
          sub={`ROAS: ${formatRoas(totals.roas)}`}
        />
      </div>
    </div>
  )
}
