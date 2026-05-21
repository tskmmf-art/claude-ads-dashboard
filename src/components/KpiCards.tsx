import type { KpiTotals } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatNumber, formatPercent, formatRoas } from '@/lib/utils/formatters'

interface KpiCardProps {
  title: string
  value: string
  isLoading: boolean
}

function KpiCard({ title, value, isLoading }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  )
}

interface Props {
  totals: KpiTotals
  isLoading: boolean
}

export function KpiCards({ totals, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <KpiCard title="Total Spend" value={formatCurrency(totals.spend)} isLoading={isLoading} />
      <KpiCard title="Impressions" value={formatNumber(totals.impressions)} isLoading={isLoading} />
      <KpiCard title="Clicks" value={formatNumber(totals.clicks)} isLoading={isLoading} />
      <KpiCard title="ROAS" value={formatRoas(totals.roas)} isLoading={isLoading} />
      <KpiCard title="CTR" value={formatPercent(totals.ctr)} isLoading={isLoading} />
      <KpiCard title="CPC" value={formatCurrency(totals.cpc)} isLoading={isLoading} />
      <KpiCard title="Conversions" value={formatNumber(totals.conversions)} isLoading={isLoading} />
    </div>
  )
}
