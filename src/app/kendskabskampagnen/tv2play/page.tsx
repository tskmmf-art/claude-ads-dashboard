'use client'

import * as React from 'react'
import { CampaignGantt } from '@/components/CampaignGantt'
import { formatCurrency, formatNumber } from '@/lib/utils/formatters'

const TV2_PHASES = [
  { name: 'Launch (Heavy)', startWeek: 19, endWeek: 21, budget: 40_000, color: '#4472CA' },
  { name: 'Sustain',        startWeek: 22, endWeek: 24, budget: 20_000, color: '#7BAFD4' },
  { name: 'Pause',          startWeek: 25, endWeek: 26, budget:      0, color: '#B8D4EC' },
]

const TV2_DEFAULTS = { impressions: 140883, reach: 69639, cpm: 269.86 }

function Stat({ label, value, sub, accent = '#D80070' }: {
  label: string; value: string; sub?: string; accent?: string
}) {
  return (
    <div
      className="rounded-xl bg-white p-5 shadow-sm border border-border overflow-hidden relative"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
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
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-screen-2xl">
          <h1 className="text-base font-bold flex items-center gap-2">
            <span className="inline-block h-4 w-1 rounded-none bg-mmf-red" />
            Kendskabskampagnen — TV2 Play
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl space-y-6 p-6">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2"><span className="inline-block h-5 w-1 rounded-none bg-mmf-red" />Kampagneplan for TV2 Play</h2>
          <CampaignGantt phases={TV2_PHASES} />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2"><span className="inline-block h-5 w-1 rounded-none bg-mmf-red" />Resultater for TV2 Play</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Eksponeringer" value={formatNumber(tv2Data.impressions)}  accent="#D80070" />
          <Stat label="Reach"         value={formatNumber(tv2Data.reach)}        accent="#D80070" />
          <Stat label="Frekvens"      value={frequency.toFixed(2)}               accent="#D80070" sub="eksponeringer pr. person" />
          <Stat label="CPM"           value={formatCurrency(tv2Data.cpm)}        accent="#D80070" sub="pr. 1.000 eksponeringer" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          * Data indtastet manuelt — rediger tallene på hovedsiden
        </p>
      </main>
    </div>
  )
}
