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
import { KAMPAGNE_PERIODE } from '@/lib/config/kendskabs'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'
import type { DateRange } from '@/types'

const BRAND = '#1877F2'
const KAMPAGNE_RANGE: DateRange = { from: KAMPAGNE_PERIODE.start, to: KAMPAGNE_PERIODE.end }

const META_PHASES = [
  { name: 'Video Views',         startWeek: 19, endWeek: 21, budget: 15_000, color: '#1877F2' },
  { name: 'Reach + Retargeting', startWeek: 22, endWeek: 24, budget: 15_000, color: '#55A3F5' },
  { name: 'High Frequency',      startWeek: 25, endWeek: 26, budget: 10_000, color: '#A8CEFB' },
]

function MetaLogo() {
  return (
    <svg width="80" height="26" viewBox="0 0 80 26" fill="none">
      {/* Meta "M" ribbon shape */}
      <path d="M4 20C4 17 5.5 14 8 11.5C10.5 9 13 8 15 10C16.5 11.5 17 13.5 17 16C17 18.5 17.5 20.5 19.5 20.5C21.5 20.5 22.5 18 22.5 14.5C22.5 10 20 6.5 15.5 5C11 3.5 6 6 3.5 11" stroke="#1877F2" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      {/* wordmark */}
      <text x="28" y="19" fontFamily="'Helvetica Neue',Arial,sans-serif" fontSize="17" fontWeight="700" fill="#1877F2" letterSpacing="-0.3">meta</text>
    </svg>
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
  const { data: demoData,   isLoading: demoLoading   } = useDemographics('meta', accountId, dateRange, true)
  const { data: deviceData, isLoading: deviceLoading } = useDeviceStats('meta', accountId, dateRange, true)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white px-6 py-4 shadow-sm" style={{ borderTop: `3px solid ${BRAND}` }}>
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <MetaLogo />
              <span className="text-sm text-muted-foreground">Kendskabskampagnen</span>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <AccountSelector platform="meta" accounts={accounts.accounts} selectedId={accountId}
                isLoading={accounts.isLoading} error={accounts.error} onChange={setAccountId} />
            </div>
            <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl space-y-6 p-6">
        <div>
          <SectionHead>Kampagneplan for Meta</SectionHead>
          <CampaignGantt phases={META_PHASES} />
        </div>

        <div>
          <SectionHead>Resultater for Meta</SectionHead>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Eksponeringer" value={formatNumber(data.impressions)}                        loading={isLoading} />
            <Stat label="Rækkevidde"    value={data.reach > 0 ? formatNumber(data.reach) : '—'}      loading={isLoading} />
            <Stat label="Frekvens"      value={data.frequency > 0 ? data.frequency.toFixed(2) : '—'} loading={isLoading} sub="eksponeringer pr. person" />
            <Stat label="CPM"           value={formatCurrency(data.cpm)}                              loading={isLoading} sub="pr. 1.000 eksponeringer" />
          </div>
        </div>

        <div>
          <SectionHead>Videovisninger — Meta</SectionHead>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3">
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
            <div className="col-span-1">
              <DevicePieChart stats={deviceData} loading={deviceLoading} color={BRAND} />
            </div>
          </div>
        </div>

        <div>
          <SectionHead>Køn og alder — Meta</SectionHead>
          <div className="grid grid-cols-2 gap-4">
            <DemographicHeatmap cells={demoData} loading={demoLoading} color={BRAND}    metric="impressions" title="Eksponeringer" />
            <DemographicHeatmap cells={demoData} loading={demoLoading} color="#0A4FA8"  metric="completions"  title="Videogennemførelse" />
          </div>
        </div>
      </main>
    </div>
  )
}
