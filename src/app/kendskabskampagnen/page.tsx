'use client'

import * as React from 'react'
import { useAccounts } from '@/hooks/useAdsData'
import { useAwareness } from '@/hooks/useAwarenessData'
import { DateRangePicker } from '@/components/filters/DateRangePicker'
import { AccountSelector } from '@/components/filters/AccountSelector'
import { Skeleton } from '@/components/ui/skeleton'
import {
  KANALER,
  SAMLET_BUDGET,
  KAMPAGNE_PERIODE,
  remainingMonths,
  remainingBudget,
  totalRemainingBudget,
  type KanalConfig,
} from '@/lib/config/kendskabs'
import type { AwarenessData } from '@/lib/api/awareness'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/formatters'
import type { DateRange } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const empty: AwarenessData = {
  spend: 0, impressions: 0, reach: 0, frequency: 0,
  linkClicks: 0,
  videoViews25: 0, videoViews50: 0, videoViews75: 0, videoViews100: 0,
  completionRate: 0, cpm: 0,
}

const KAMPAGNE_RANGE: DateRange = {
  from: KAMPAGNE_PERIODE.start,
  to:   KAMPAGNE_PERIODE.end,
}

function Stat({ label, value, sub, loading }: {
  label: string; value: string; sub?: string; loading?: boolean
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {loading
        ? <Skeleton className="mt-2 h-8 w-28" />
        : <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      }
      {sub && !loading && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th className={`border-b bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground ${right ? 'text-right' : 'text-left'}`}>
    {children}
  </th>
)
const TD = ({ children, right, bold, muted }: {
  children: React.ReactNode; right?: boolean; bold?: boolean; muted?: boolean
}) => (
  <td className={`border-b px-4 py-3 text-sm tabular-nums ${right ? 'text-right' : ''} ${bold ? 'font-semibold' : ''} ${muted ? 'text-muted-foreground' : ''}`}>
    {children}
  </td>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KendskabskampagnenPage() {
  const [dateRange, setDateRange] = React.useState<DateRange>(KAMPAGNE_RANGE)
  const [metaAccountId,   setMetaAccountId]   = React.useState<string | null>(null)
  const [googleAccountId, setGoogleAccountId] = React.useState<string | null>(null)

  const metaAccounts   = useAccounts('meta',   true)
  const googleAccounts = useAccounts('google', true)

  React.useEffect(() => {
    if (metaAccounts.accounts.length > 0 && !metaAccountId)
      setMetaAccountId(metaAccounts.accounts[0].id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaAccounts.accounts])

  React.useEffect(() => {
    if (googleAccounts.accounts.length > 0 && !googleAccountId)
      setGoogleAccountId(googleAccounts.accounts[0].id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleAccounts.accounts])

  const metaAwareness   = useAwareness('meta',   metaAccountId,   dateRange, true)
  const googleAwareness = useAwareness('google', googleAccountId, dateRange, true)

  const isLoading = metaAwareness.isLoading || googleAwareness.isLoading

  // Anvend manualReach på kanaler der har det sat — overskriver API-reach og genberegner frekvens
  function applyManualReach(base: AwarenessData, kanal: KanalConfig): AwarenessData {
    const reach = kanal.manualReach && kanal.manualReach > 0 ? kanal.manualReach : base.reach
    return {
      ...base,
      reach,
      frequency: reach > 0 ? base.impressions / reach : base.frequency,
    }
  }

  // Map kanal-id → AwarenessData (youtube bruger Google Ads API)
  const rawData: Record<string, AwarenessData> = {
    meta:    metaAwareness.data,
    youtube: googleAwareness.data,
    tv2play: empty,
  }
  const apiData: Record<string, AwarenessData> = Object.fromEntries(
    KANALER.map(k => [k.id, applyManualReach(rawData[k.id] ?? empty, k)])
  )

  // ── Budget ────────────────────────────────────────────────────────────────

  const totalSpent = apiData['meta'].spend + apiData['youtube'].spend
  const budgetLeft = totalRemainingBudget(totalSpent)
  const remaining  = remainingMonths()

  function kanalSpent(k: KanalConfig) {
    return apiData[k.id]?.spend ?? 0
  }

  function kanalPctAfBudget(k: KanalConfig) {
    return SAMLET_BUDGET > 0 ? k.budget / SAMLET_BUDGET : 0
  }

  function kanalPctBrugt(k: KanalConfig) {
    return k.budget > 0 ? kanalSpent(k) / k.budget : 0
  }

  function kanalPrMaanedFremad(k: KanalConfig) {
    const left = remainingBudget(k, kanalSpent(k))
    return remaining > 0 ? left / remaining : left
  }

  function kanalIsLoading(k: KanalConfig) {
    if (k.id === 'meta')    return metaAwareness.isLoading
    if (k.id === 'youtube') return googleAwareness.isLoading
    return false
  }

  // ── Performance ───────────────────────────────────────────────────────────

  const totals: AwarenessData = KANALER.reduce((acc, k) => {
    const d = apiData[k.id]
    return {
      spend:          acc.spend          + d.spend,
      impressions:    acc.impressions    + d.impressions,
      reach:          acc.reach          + d.reach,
      frequency:      0,
      linkClicks:     acc.linkClicks     + d.linkClicks,
      videoViews25:   acc.videoViews25   + d.videoViews25,
      videoViews50:   acc.videoViews50   + d.videoViews50,
      videoViews75:   acc.videoViews75   + d.videoViews75,
      videoViews100:  acc.videoViews100  + d.videoViews100,
      completionRate: 0,
      cpm:            0,
    }
  }, { ...empty })
  totals.frequency      = totals.reach > 0 ? totals.impressions / totals.reach : 0
  totals.completionRate = totals.impressions > 0 ? totals.videoViews100 / totals.impressions : 0
  totals.cpm            = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0

  const dash = <span className="text-muted-foreground/50">—</span>

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-base font-bold">Kendskabskampagnen</h1>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <AccountSelector
                platform="meta"
                accounts={metaAccounts.accounts}
                selectedId={metaAccountId}
                isLoading={metaAccounts.isLoading}
                error={metaAccounts.error}
                onChange={setMetaAccountId}
              />
              <AccountSelector
                platform="google"
                accounts={googleAccounts.accounts}
                selectedId={googleAccountId}
                isLoading={googleAccounts.isLoading}
                error={googleAccounts.error}
                onChange={setGoogleAccountId}
              />
            </div>
            <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl space-y-8 p-6">

        {/* ── SEKTION 1: BUDGET ───────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Budget"
            description={`Kampagneperiode: maj–juni 2026 · Samlet budget: ${formatCurrency(SAMLET_BUDGET)}`}
          />

          {/* Summary cards */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Samlet budget"         value={formatCurrency(SAMLET_BUDGET)}    sub="Maj–juni 2026" />
            <Stat label="Budget brugt til dato" value={formatCurrency(totalSpent)}        sub="Meta + Google (API)" loading={isLoading} />
            <Stat label="Budget tilbage"        value={formatCurrency(budgetLeft)}        sub={formatPercent(SAMLET_BUDGET > 0 ? budgetLeft / SAMLET_BUDGET : 0) + ' tilbage'} loading={isLoading} />
          </div>

          {/* Budget table */}
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <TH>Kanal</TH>
                  <TH right>Budget</TH>
                  <TH right>Procentdel af budget</TH>
                  <TH right>Budget til dato</TH>
                  <TH right>Procentdel budget brugt</TH>
                  <TH right>Budget tilbage</TH>
                  <TH right>Pr. måned fremad</TH>
                </tr>
              </thead>
              <tbody>
                {KANALER.map((k) => {
                  const spent   = kanalSpent(k)
                  const loading = kanalIsLoading(k)
                  return (
                    <tr key={k.id} className="hover:bg-muted/20">
                      <TD bold>{k.name}</TD>
                      <TD right>{k.budget > 0 ? formatCurrency(k.budget) : dash}</TD>
                      <TD right muted>{k.budget > 0 ? formatPercent(kanalPctAfBudget(k)) : dash}</TD>
                      <TD right>
                        {loading
                          ? <Skeleton className="ml-auto h-4 w-20" />
                          : k.platform ? formatCurrency(spent) : dash}
                      </TD>
                      <TD right>
                        {loading
                          ? <Skeleton className="ml-auto h-4 w-16" />
                          : k.platform && k.budget > 0 ? formatPercent(kanalPctBrugt(k)) : dash}
                      </TD>
                      <TD right muted>
                        {k.platform
                          ? loading ? <Skeleton className="ml-auto h-4 w-20" /> : formatCurrency(remainingBudget(k, spent))
                          : k.budget > 0 ? formatCurrency(k.budget) : dash}
                      </TD>
                      <TD right>
                        {loading
                          ? <Skeleton className="ml-auto h-4 w-20" />
                          : remaining > 0 && k.budget > 0 ? formatCurrency(kanalPrMaanedFremad(k)) : dash}
                      </TD>
                    </tr>
                  )
                })}
                {/* Total */}
                <tr className="bg-muted/30">
                  <TD bold>Total</TD>
                  <TD right bold>{formatCurrency(SAMLET_BUDGET)}</TD>
                  <TD right bold>{formatPercent(1)}</TD>
                  <TD right bold>
                    {isLoading ? <Skeleton className="ml-auto h-4 w-20" /> : formatCurrency(totalSpent)}
                  </TD>
                  <TD right bold>
                    {isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : formatPercent(SAMLET_BUDGET > 0 ? totalSpent / SAMLET_BUDGET : 0)}
                  </TD>
                  <TD right bold>
                    {isLoading ? <Skeleton className="ml-auto h-4 w-20" /> : formatCurrency(budgetLeft)}
                  </TD>
                  <TD right bold>
                    {isLoading ? <Skeleton className="ml-auto h-4 w-20" />
                      : remaining > 0 ? formatCurrency(budgetLeft / remaining) : dash}
                  </TD>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── SEKTION 2: PERFORMANCE ──────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Performance"
            description="Reach, eksponeringer og videovisninger pr. kanal"
          />

          {/* Summary cards */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Eksponeringer" value={formatNumber(totals.impressions)}  loading={isLoading} />
            <Stat label="Reach"         value={totals.reach > 0 ? formatNumber(totals.reach) : '—'} loading={isLoading} />
            <Stat label="Frekvens"      value={totals.frequency > 0 ? totals.frequency.toFixed(2) : '—'} loading={isLoading} sub="eksponeringer pr. person" />
            <Stat label="CPM"           value={formatCurrency(totals.cpm)}        loading={isLoading} sub="pr. 1.000 eksponeringer" />
          </div>

          {/* Performance table */}
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <TH>Kanal</TH>
                  <TH right>Reach</TH>
                  <TH right>Eksponeringer</TH>
                  <TH right>Frekvens</TH>
                  <TH right>Klik på link</TH>
                  <TH right>Visn. 25%</TH>
                  <TH right>Visn. 50%</TH>
                  <TH right>Visn. 75%</TH>
                  <TH right>Visn. 100%</TH>
                  <TH right>Fuldførelse%</TH>
                  <TH right>CPM</TH>
                </tr>
              </thead>
              <tbody>
                {KANALER.map((k) => {
                  const d       = apiData[k.id]
                  const loading = kanalIsLoading(k)
                  const noApi   = k.platform === null
                  const sk      = () => <Skeleton className="ml-auto h-4 w-16" />
                  return (
                    <tr key={k.id} className="hover:bg-muted/20">
                      <TD bold>{k.name}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.reach > 0 ? formatNumber(d.reach) : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : formatNumber(d.impressions)}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.frequency > 0 ? d.frequency.toFixed(2) : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.linkClicks > 0 ? formatNumber(d.linkClicks) : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.videoViews25  > 0 ? formatNumber(d.videoViews25)  : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.videoViews50  > 0 ? formatNumber(d.videoViews50)  : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.videoViews75  > 0 ? formatNumber(d.videoViews75)  : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.videoViews100 > 0 ? formatNumber(d.videoViews100) : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.videoViews100 > 0 ? formatPercent(d.completionRate) : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : formatCurrency(d.cpm)}</TD>
                    </tr>
                  )
                })}
                {/* Total */}
                <tr className="bg-muted/30">
                  <TD bold>Total</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : totals.reach > 0 ? formatNumber(totals.reach) : dash}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : formatNumber(totals.impressions)}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-12" /> : totals.frequency > 0 ? totals.frequency.toFixed(2) : dash}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : totals.linkClicks > 0 ? formatNumber(totals.linkClicks) : dash}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : totals.videoViews25  > 0 ? formatNumber(totals.videoViews25)  : dash}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : totals.videoViews50  > 0 ? formatNumber(totals.videoViews50)  : dash}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : totals.videoViews75  > 0 ? formatNumber(totals.videoViews75)  : dash}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : totals.videoViews100 > 0 ? formatNumber(totals.videoViews100) : dash}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-12" /> : totals.videoViews100 > 0 ? formatPercent(totals.completionRate) : dash}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : formatCurrency(totals.cpm)}</TD>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            * YouTube og TV2 Play tilføjes manuelt — opdater <code className="rounded bg-muted px-1">src/lib/config/kendskabs.ts</code>
            &nbsp;· Google Ads reach er ikke tilgængeligt via standard kampagne-API
          </p>
        </section>

      </main>
    </div>
  )
}
