import type { KpiTotals } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber, formatPercent, formatRoas } from '@/lib/utils/formatters'

interface KpiCardProps {
  label: string
  value: string
  isLoading: boolean
  sub?: string
  accent?: string   // venstre-kant farve
}

function KpiCard({ label, value, isLoading, sub, accent = '#D80070' }: KpiCardProps) {
  return (
    <div
      className="rounded-xl bg-white p-5 shadow-sm border border-border overflow-hidden relative"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-28" />
      ) : (
        <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
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
      {/* Row 1 — reach & engagement, MMF Rød */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Impressions"
          value={formatNumber(totals.impressions)}
          isLoading={isLoading}
          sub={`Ø ${formatNumber(Math.round(totals.impressions / Math.max(days, 1)))} / dag`}
          accent="#D80070"
        />
        <KpiCard
          label="Klik"
          value={formatNumber(totals.clicks)}
          isLoading={isLoading}
          sub={`Ø ${formatNumber(Math.round(totals.clicks / Math.max(days, 1)))} / dag`}
          accent="#D80070"
        />
        <KpiCard
          label="Klik på link"
          value={formatNumber(totals.linkClicks)}
          isLoading={isLoading}
          accent="#D80070"
        />
        <KpiCard
          label="Gns. dagligt forbrug"
          value={formatCurrency(totals.avgDailySpend)}
          isLoading={isLoading}
          sub={`${days} dage i alt`}
          accent="#D80070"
        />
      </div>

      {/* Row 2 — økonomi, Gylden */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Samlet forbrug"
          value={formatCurrency(totals.spend)}
          isLoading={isLoading}
          accent="#B5AE8E"
        />
        <KpiCard
          label="CPM"
          value={formatCurrency(totals.cpm)}
          isLoading={isLoading}
          sub="pr. 1.000 visninger"
          accent="#B5AE8E"
        />
        <KpiCard
          label="CPC"
          value={formatCurrency(totals.cpc)}
          isLoading={isLoading}
          sub="pr. klik"
          accent="#B5AE8E"
        />
        <KpiCard
          label="CTR"
          value={formatPercent(totals.ctr)}
          isLoading={isLoading}
          sub={`ROAS: ${formatRoas(totals.roas)}`}
          accent="#B5AE8E"
        />
      </div>
    </div>
  )
}
