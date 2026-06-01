'use client'

import * as React from 'react'
import { useAccounts } from '@/hooks/useAdsData'
import { useAwareness } from '@/hooks/useAwarenessData'
import { DateRangePicker } from '@/components/filters/DateRangePicker'
import { AccountSelector } from '@/components/filters/AccountSelector'
import { Skeleton } from '@/components/ui/skeleton'
import { CampaignGantt } from '@/components/CampaignGantt'
import { DemographicHeatmap } from '@/components/DemographicHeatmap'
import { useDemographics } from '@/hooks/useDemographics'
import { KAMPAGNE_PERIODE, KANALER } from '@/lib/config/kendskabs'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'
import type { DateRange } from '@/types'

const KAMPAGNE_RANGE: DateRange = { from: KAMPAGNE_PERIODE.start, to: KAMPAGNE_PERIODE.end }
const youtubeKanal = KANALER.find(k => k.id === 'youtube')!

const YOUTUBE_PHASES = [
  { name: 'Reach (Skippable)', startWeek: 19, endWeek: 21, budget: 15_000, color: '#DC2626' },
  { name: 'Non-skip',          startWeek: 19, endWeek: 24, budget: 25_000, color: '#F87171' },
  { name: 'Retargeting',       startWeek: 22, endWeek: 26, budget: 10_000, color: '#FCA5A5' },
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

export default function YouTubePage() {
  const [dateRange, setDateRange] = React.useState<DateRange>(KAMPAGNE_RANGE)
  const [accountId, setAccountId] = React.useState<string | null>(null)

  const [manualReach] = React.useState<number>(() => {
    if (typeof window === 'undefined') return youtubeKanal.manualReach ?? 0
    try {
      const stored = JSON.parse(localStorage.getItem('kendskab_manual_reaches') ?? '{}')
      return stored['youtube'] ?? youtubeKanal.manualReach ?? 0
    } catch { return youtubeKanal.manualReach ?? 0 }
  })

  const accounts = useAccounts('google', true)
  React.useEffect(() => {
    if (accounts.accounts.length > 0 && !accountId)
      setAccountId(accounts.accounts[0].id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.accounts])

  const { data, isLoading }   = useAwareness('google', accountId, dateRange, true)
  const { data: demoData, isLoading: demoLoading } = useDemographics('google', accountId, dateRange, true)

  const reach       = manualReach > 0 ? manualReach : data.reach
  const impressions = data.coviewedImpressions
  const frequency   = reach > 0 ? impressions / reach : data.frequency

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-base font-bold flex items-center gap-2">
              <span className="inline-block h-4 w-1 rounded-none bg-mmf-red" />
              Kendskabskampagnen — YouTube
            </h1>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <AccountSelector
                platform="google"
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
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2"><span className="inline-block h-5 w-1 rounded-none bg-mmf-red" />Kampagneplan for YouTube</h2>
          <CampaignGantt phases={YOUTUBE_PHASES} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2"><span className="inline-block h-5 w-1 rounded-none bg-mmf-red" />Resultater for YouTube</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Eksponeringer" value={impressions > 0 ? formatNumber(impressions) : '—'}  loading={isLoading} accent="#D80070" />
          <Stat label="Reach"         value={reach > 0 ? formatNumber(reach) : '—'}              loading={isLoading} accent="#D80070" />
          <Stat label="Frekvens"      value={frequency > 0 ? frequency.toFixed(2) : '—'}         loading={isLoading} sub="eksponeringer pr. person" accent="#D80070" />
          <Stat label="CPM"           value={formatCurrency(data.cpm)}                            loading={isLoading} sub="pr. 1.000 eksponeringer"  accent="#D80070" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
            <span className="inline-block h-5 w-1 rounded-none bg-mmf-red" />
            Køn og alder — YouTube
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <DemographicHeatmap cells={demoData} loading={demoLoading} color="#4472CA" metric="impressions" title="Eksponeringer" />
            <DemographicHeatmap cells={demoData} loading={demoLoading} color="#D80070" metric="completions"  title="Videogennemførelse" />
          </div>
        </div>
      </main>
    </div>
  )
}
