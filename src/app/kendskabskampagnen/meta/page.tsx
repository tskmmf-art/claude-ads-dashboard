'use client'

import * as React from 'react'
import { useAccounts } from '@/hooks/useAdsData'
import { useAwareness } from '@/hooks/useAwarenessData'
import { DateRangePicker } from '@/components/filters/DateRangePicker'
import { AccountSelector } from '@/components/filters/AccountSelector'
import { Skeleton } from '@/components/ui/skeleton'
import { CampaignGantt } from '@/components/CampaignGantt'
import { CampaignCards, type Campaign } from '@/components/CampaignCards'
import { DemographicHeatmap } from '@/components/DemographicHeatmap'
import { DevicePieChart } from '@/components/DevicePieChart'
import { VideoFunnel } from '@/components/VideoFunnel'
import { RevealToggle, Revealable } from '@/components/RevealToggle'
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

const META_CAMPAIGNS: Campaign[] = [
  {
    name: 'Brand Awareness',
    description: 'Optimeret til rækkevidde og kendskab. Vises i feed, Stories og Reels på tværs af Facebook og Instagram.',
    duration: 'Op til 60 sek',
    skippable: 'Kan skippes',
  },
  {
    name: 'Retargeting',
    description: 'Vises til brugere der tidligere har interageret med annoncerne eller besøgt hjemmesiden. Optimeret til at genvinde opmærksomhed og drive konvertering.',
    duration: 'Op til 60 sek',
    skippable: 'Kan skippes',
  },
]

function MetaLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="40" height="26" viewBox="0 0 40 28" fill="none" aria-label="Meta">
        {/* Infinity-mærket — én sammenhængende möbius-løkke */}
        <path
          d="M11.4 20.8C7.9 20.8 5.6 17.9 5.6 14S7.9 7.2 11.4 7.2c2.9 0 4.9 2 7 5l1.6 2.4 1.6-2.4c2.1-3 4.1-5 7-5 3.5 0 5.8 2.9 5.8 6.8s-2.3 6.8-5.8 6.8c-2.9 0-4.9-2-7-5L20 13.4l-1.6 2.4c-2.1 3-4.1 5-7 5z"
          fill="none"
          stroke={BRAND}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{ fontFamily: "'Helvetica Neue',Arial,sans-serif", fontWeight: 700, fontSize: '19px', color: BRAND, letterSpacing: '-0.4px' }}>
        meta
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

export default function MetaPage() {
  const [dateRange, setDateRange] = React.useState<DateRange>(KAMPAGNE_RANGE)
  const [accountId, setAccountId] = React.useState<string | null>(null)
  const [revealed,  setRevealed]  = React.useState(false)

  const accounts = useAccounts('meta', true)
  React.useEffect(() => {
    if (accounts.accounts.length > 0 && !accountId) {
      const preferred = accounts.accounts.find(a => a.name.toLowerCase().includes('ekstern branding'))
      setAccountId((preferred ?? accounts.accounts[0]).id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.accounts])

  const { data, isLoading } = useAwareness('meta', accountId, dateRange, true)
  const { data: demoData,     isLoading: demoLoading     } = useDemographics('meta', accountId, dateRange, true)
  const { data: platformData, isLoading: platformLoading } = useDeviceStats('meta', accountId, dateRange, true, 'platform')

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
          <SectionHead>Kampagner</SectionHead>
          <CampaignCards campaigns={META_CAMPAIGNS} color={BRAND} />
        </div>

        <RevealToggle revealed={revealed} onToggle={() => setRevealed(v => !v)} />

        <Revealable revealed={revealed}>
          <div className="space-y-6">
            <div>
              <SectionHead>Resultater for Meta</SectionHead>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Eksponeringer" value={formatNumber(data.impressions)}                        loading={isLoading} />
                <Stat label="Reach"         value={data.reach > 0 ? formatNumber(data.reach) : '—'}      loading={isLoading} />
                <Stat label="Frekvens"      value={data.frequency > 0 ? data.frequency.toFixed(2) : '—'} loading={isLoading} sub="eksponeringer pr. person" />
                <Stat label="CPM"           value={formatCurrency(data.cpm)}                              loading={isLoading} sub="pr. 1.000 eksponeringer" />
              </div>
            </div>

            <div>
              <SectionHead>Videovisninger — Meta</SectionHead>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                <div className="lg:col-span-2">
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
                <DevicePieChart stats={platformData} loading={platformLoading} color={BRAND}
                  title="Eksponeringer pr. platform" metric="impressions" />
                <DevicePieChart stats={platformData} loading={platformLoading} color={BRAND}
                  title="Thruplays pr. platform"     metric="completions" />
              </div>
            </div>

            <div>
              <SectionHead>Køn og alder — Meta</SectionHead>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <DemographicHeatmap cells={demoData} loading={demoLoading} color={BRAND}    metric="impressions" title="Eksponeringer" />
                <DemographicHeatmap cells={demoData} loading={demoLoading} color="#0A4FA8"  metric="completions"  title="Videogennemførelse" />
              </div>
            </div>
          </div>
        </Revealable>
      </main>
    </div>
  )
}
