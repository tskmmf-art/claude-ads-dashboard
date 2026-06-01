'use client'

import * as React from 'react'
import { useAccounts } from '@/hooks/useAdsData'
import { useAwareness } from '@/hooks/useAwarenessData'
import { DateRangePicker } from '@/components/filters/DateRangePicker'
import { AccountSelector } from '@/components/filters/AccountSelector'
import { Skeleton } from '@/components/ui/skeleton'
import { CampaignGantt } from '@/components/CampaignGantt'
import { KAMPAGNE_PERIODE } from '@/lib/config/kendskabs'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'
import type { DateRange } from '@/types'

const KAMPAGNE_RANGE: DateRange = { from: KAMPAGNE_PERIODE.start, to: KAMPAGNE_PERIODE.end }

const META_PHASES = [
  { name: 'Video Views',        startWeek: 19, endWeek: 21, budget: 15_000, color: '#059669' },
  { name: 'Reach + Retargeting', startWeek: 22, endWeek: 24, budget: 15_000, color: '#34D399' },
  { name: 'High Frequency',     startWeek: 25, endWeek: 26, budget: 10_000, color: '#6EE7B7' },
]

function Stat({ label, value, sub, loading, accent = '#D80070' }: {
  label: string; value: string; sub?: string; loading?: boolean; accent?: string
}) {
  return (
    <div
      className="rounded-xl bg-white p-5 shadow-sm border border-border overflow-hidden relative"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {loading
        ? <Skeleton className="mt-2 h-8 w-28" />
        : <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      }
      {sub && !loading && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default function MetaPage() {
  const [dateRange, setDateRange] = React.useState<DateRange>(KAMPAGNE_RANGE)
  const [accountId, setAccountId] = React.useState<string | null>(null)

  const accounts = useAccounts('meta', true)
  React.useEffect(() => {
    if (accounts.accounts.length > 0 && !accountId) {
      const preferred = accounts.accounts.find(a => a.name.toLowerCase().includes('ekstern branding'))
      setAccountId((preferred ?? accounts.accounts[0]).id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.accounts])

  const { data, isLoading } = useAwareness('meta', accountId, dateRange, true)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-base font-bold flex items-center gap-2">
              <span className="inline-block h-4 w-1 rounded-none bg-mmf-red" />
              Kendskabskampagnen — Meta
            </h1>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <AccountSelector
                platform="meta"
                accounts={accounts.accounts}
                selectedId={accountId}
                isLoading={accounts.isLoading}
                error={accounts.error}
                onChange={setAccountId}
              />
            </div>
            <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl space-y-6 p-6">
        <CampaignGantt phases={META_PHASES} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Eksponeringer" value={formatNumber(data.impressions)}                        loading={isLoading} accent="#D80070" />
          <Stat label="Reach"         value={data.reach > 0 ? formatNumber(data.reach) : '—'}      loading={isLoading} accent="#D80070" />
          <Stat label="Frekvens"      value={data.frequency > 0 ? data.frequency.toFixed(2) : '—'} loading={isLoading} sub="eksponeringer pr. person" accent="#D80070" />
          <Stat label="CPM"           value={formatCurrency(data.cpm)}                              loading={isLoading} sub="pr. 1.000 eksponeringer"  accent="#D80070" />
        </div>
      </main>
    </div>
  )
}
