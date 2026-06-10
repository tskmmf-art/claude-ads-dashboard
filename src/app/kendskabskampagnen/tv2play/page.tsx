'use client'

import * as React from 'react'
import { CampaignGantt } from '@/components/CampaignGantt'
import { VideoFunnel } from '@/components/VideoFunnel'
import { DevicePieChart } from '@/components/DevicePieChart'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'

const BRAND = '#E40012'

const TV2_PHASES = [
  { name: 'Launch (Heavy)', startWeek: 19, endWeek: 21, budget: 40_000, color: '#E40012' },
  { name: 'Sustain',        startWeek: 22, endWeek: 24, budget: 20_000, color: '#EE5A64' },
  { name: 'Pause',          startWeek: 25, endWeek: 26, budget:      0, color: '#F5A8AE' },
]

const TV2_DEFAULTS = { impressions: 140883, reach: 69639, cpm: 269.86, completionRate: 0.9763 }

export const TV2_DEVICE_STATS = [
  { device: 'TV',      impressions: 145_418 },
  { device: 'Desktop', impressions:   6_369 },
  { device: 'Tablet',  impressions:   7_117 },
  { device: 'Mobile',  impressions:   3_625 },
]

function TV2Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded px-2 py-0.5" style={{ background: BRAND }}>
        <span style={{ fontFamily: "'Arial Black',Arial,sans-serif", fontWeight: 900, fontSize: '16px', color: 'white', letterSpacing: '0.5px' }}>
          TV 2
        </span>
      </div>
      <span style={{ fontFamily: "'Arial Black',Arial,sans-serif", fontWeight: 900, fontSize: '14px', color: BRAND, letterSpacing: '1px' }}>
        PLAY
      </span>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-border overflow-hidden relative"
      style={{ borderLeft: `4px solid ${BRAND}` }}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
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

export default function TV2PlayPage() {
  const [tv2Data] = React.useState(() => {
    if (typeof window === 'undefined') return TV2_DEFAULTS
    try {
      const stored = localStorage.getItem('kendskab_tv2_data')
      return stored ? { ...TV2_DEFAULTS, ...JSON.parse(stored) } : TV2_DEFAULTS
    } catch { return TV2_DEFAULTS }
  })

  const frequency = tv2Data.reach > 0 ? tv2Data.impressions / tv2Data.reach : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white px-6 py-4 shadow-sm" style={{ borderTop: `3px solid ${BRAND}` }}>
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex items-center gap-3">
            <TV2Logo />
            <span className="text-sm text-muted-foreground">Kendskabskampagnen</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl space-y-6 p-6">
        <div>
          <SectionHead>Kampagneplan for TV2 Play</SectionHead>
          <CampaignGantt phases={TV2_PHASES} />
        </div>

        <div>
          <SectionHead>Resultater for TV2 Play</SectionHead>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Eksponeringer" value={formatNumber(tv2Data.impressions)} />
            <Stat label="Reach"         value={formatNumber(tv2Data.reach)} />
            <Stat label="Frekvens"      value={frequency.toFixed(2)}   sub="eksponeringer pr. person" />
            <Stat label="CPM"           value={formatCurrency(tv2Data.cpm)} sub="pr. 1.000 eksponeringer" />
          </div>
        </div>

        <div>
          <SectionHead>Devicefordeling — TV2 Play</SectionHead>
          <div className="max-w-xs">
            <DevicePieChart stats={TV2_DEVICE_STATS} />
          </div>
        </div>

        <div>
          <SectionHead>Videovisninger — TV2 Play</SectionHead>
          <VideoFunnel
            data={{
              impressions:    tv2Data.impressions,
              videoViews100:  Math.round(tv2Data.impressions * tv2Data.completionRate),
              completionRate: tv2Data.completionRate,
            }}
            color={BRAND}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          * Data indtastet manuelt — rediger tallene på hovedsiden
        </p>
      </main>
    </div>
  )
}
