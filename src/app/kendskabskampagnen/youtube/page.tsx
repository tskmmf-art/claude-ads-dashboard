'use client'

import * as React from 'react'
import { useAccounts } from '@/hooks/useAdsData'
import { useAwareness } from '@/hooks/useAwarenessData'
import { DateRangePicker } from '@/components/filters/DateRangePicker'
import { AccountSelector } from '@/components/filters/AccountSelector'
import { Skeleton } from '@/components/ui/skeleton'
import { CampaignGantt } from '@/components/CampaignGantt'
import { DemographicHeatmap } from '@/components/DemographicHeatmap'
import { DevicePieChart } from '@/components/DevicePieChart'
import { VideoFunnel } from '@/components/VideoFunnel'
import { useDemographics } from '@/hooks/useDemographics'
import { useDeviceStats } from '@/hooks/useDeviceStats'
import { KAMPAGNE_PERIODE, KANALER } from '@/lib/config/kendskabs'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'
import type { DateRange } from '@/types'

const BRAND = '#FF0000'
const KAMPAGNE_RANGE: DateRange = { from: KAMPAGNE_PERIODE.start, to: KAMPAGNE_PERIODE.end }
const youtubeKanal = KANALER.find(k => k.id === 'youtube')!

const YOUTUBE_PHASES = [
  { name: 'Reach (Skippable)', startWeek: 19, endWeek: 21, budget: 15_000, color: '#FF0000' },
  { name: 'Non-skip',          startWeek: 19, endWeek: 24, budget: 25_000, color: '#FF5555' },
  { name: 'Retargeting',       startWeek: 22, endWeek: 26, budget: 10_000, color: '#FFAAAA' },
]

function YouTubeLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="36" height="26" viewBox="0 0 36 26" fill="none">
        <rect width="36" height="26" rx="6" fill="#FF0000" />
        <path d="M14 8l12 5-12 5V8z" fill="white" />
      </svg>
      <span style={{ fontFamily: "'Helvetica Neue',Arial,sans-serif", fontWeight: 700, fontSize: '18px', color: '#282828', letterSpacing: '-0.3px' }}>
        YouTube
      </span>
    </div>
  )
}

function Stat({ label, value, sub, loading }: {
  label: string; value: string; sub?: string; loading?: boolean
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-border overflow-hidden relative"
      style={{ borderLeft: `4px solid ${BRAND}` }}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {loading ? <Skeleton className="mt-2 h-8 w-28" />
        : <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>}
      {sub && !loading && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
      <span className="inline-block h-5 w-1 rounded-none" style={{ background: BRAND }} />
      {children}
    </h2>
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

  const { data, isLoading } = useAwareness('google', accountId, dateRange, true)
  const { data: demoData,   isLoading: demoLoading   } = useDemographics('google', accountId, dateRange, true)
  const { data: deviceData, isLoading: deviceLoading } = useDeviceStats('google', accountId, dateRange, true)

  const reach       = manualReach > 0 ? manualReach : data.reach
  const impressions = data.coviewedImpressions
  const frequency   = reach > 0 ? impressions / reach : data.frequency

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white px-6 py-4 shadow-sm" style={{ borderTop: `3px solid ${BRAND}` }}>
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <YouTubeLogo />
              <span className="text-sm text-muted-foreground">Kendskabskampagnen</span>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <AccountSelector platform="google" accounts={accounts.accounts} selectedId={accountId}
                isLoading={accounts.isLoading} error={accounts.error} onChange={setAccountId} />
            </div>
            <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl space-y-6 p-6">
        <div>
          <SectionHead>Kampagneplan for YouTube</SectionHead>
          <CampaignGantt phases={YOUTUBE_PHASES} />
        </div>

        <div>
          <SectionHead>Resultater for YouTube</SectionHead>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Eksponeringer" value={impressions > 0 ? formatNumber(impressions) : '—'}  loading={isLoading} />
            <Stat label="Reach"         value={reach > 0 ? formatNumber(reach) : '—'}              loading={isLoading} />
            <Stat label="Frekvens"      value={frequency > 0 ? frequency.toFixed(2) : '—'}         loading={isLoading} sub="eksponeringer pr. person" />
            <Stat label="CPM"           value={formatCurrency(data.cpm)}                            loading={isLoading} sub="pr. 1.000 eksponeringer" />
          </div>
        </div>

        <div>
          <SectionHead>Videovisninger — YouTube</SectionHead>
          <div className="grid gap-4" style={{ gridTemplateColumns: '65% 35%' }}>
            <div>
              <VideoFunnel
                data={{
                  impressions:    data.impressions,
                  videoViews25:   data.videoViews25,
                  videoViews50:   data.videoViews50,
                  videoViews75:   data.videoViews75,
                  videoViews100:  data.videoViews100,
                  completionRate: data.completionRate,
                }}
                loading={isLoading}
                color={BRAND}
              />
            </div>
            <div>
              <DevicePieChart stats={deviceData} loading={deviceLoading} color={BRAND} />
            </div>
          </div>
        </div>

        <div>
          <SectionHead>Køn og alder — YouTube</SectionHead>
          <div className="grid grid-cols-2 gap-4">
            <DemographicHeatmap cells={demoData} loading={demoLoading} color={BRAND}   metric="impressions" title="Eksponeringer" />
            <DemographicHeatmap cells={demoData} loading={demoLoading} color="#AA0000" metric="completions"  title="Videogennemførelse" />
          </div>
        </div>
      </main>
    </div>
  )
}
