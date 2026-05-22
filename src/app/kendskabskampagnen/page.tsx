'use client'

import * as React from 'react'
import type { Platform, PlatformState } from '@/types'
import { useAccounts } from '@/hooks/useAdsData'
import { useAwareness } from '@/hooks/useAwarenessData'
import { useDateRange } from '@/hooks/useDateRange'
import { DateRangePicker } from '@/components/filters/DateRangePicker'
import { AccountSelector } from '@/components/filters/AccountSelector'
import { Skeleton } from '@/components/ui/skeleton'
import {
  KANALER,
  SAMLET_BUDGET,
  remainingMonths,
  remainingBudget,
  totalRemainingBudget,
  type KanalConfig,
} from '@/lib/config/kendskabs'
import type { AwarenessData } from '@/lib/api/awareness'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/formatters'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const empty: AwarenessData = {
  spend: 0, impressions: 0, reach: 0, frequency: 0,
  videoViews25: 0, videoViews50: 0, videoViews75: 0, videoViews100: 0,
  completionRate: 0, cpm: 0,
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
const TD = ({ children, right, bold, muted }: { children: React.ReactNode; right?: boolean; bold?: boolean; muted?: boolean }) => (
  <td className={`border-b px-4 py-3 text-sm tabular-nums ${right ? 'text-right' : ''} ${bold ? 'font-semibold' : ''} ${muted ? 'text-muted-foreground' : ''}`}>
    {children}
  </td>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KendskabskampagnenPage() {
  const { dateRange, setDateRange } = useDateRange()

  // Account state for Meta + LinkedIn
  const [metaAccountId, setMetaAccountId] = React.useState<string | null>(null)
  const [liAccountId, setLiAccountId] = React.useState<string | null>(null)
  const [metaEnabled] = React.useState(true)
  const [liEnabled] = React.useState(true)

  const metaAccounts   = useAccounts('meta',     metaEnabled)
  const liAccounts     = useAccounts('linkedin', liEnabled)

  React.useEffect(() => {
    if (metaAccounts.accounts.length > 0 && !metaAccountId)
      setMetaAccountId(metaAccounts.accounts[0].id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaAccounts.accounts])

  React.useEffect(() => {
    if (liAccounts.accounts.length > 0 && !liAccountId)
      setLiAccountId(liAccounts.accounts[0].id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liAccounts.accounts])

  // Awareness data
  const metaAwareness = useAwareness('meta',     metaAccountId, dateRange, metaEnabled)
  const liAwareness   = useAwareness('linkedin', liAccountId,   dateRange, liEnabled)

  const isLoading = metaAwareness.isLoading || liAwareness.isLoading

  // Map platform id → awareness data
  const apiData: Record<string, AwarenessData> = {
    meta:     metaAwareness.data,
    linkedin: liAwareness.data,
    youtube:  empty,
    tv2play:  empty,
  }

  // ── Budget calculations ────────────────────────────────────────────────────

  const totalSpent  = KANALER.reduce((s, k) => s + (apiData[k.id]?.spend ?? 0), 0)
  const budgetLeft  = SAMLET_BUDGET - totalSpent
  const remaining   = remainingMonths()
  const totalRemBud = totalRemainingBudget()

  function kanalBudgetTilDato(k: KanalConfig) {
    return apiData[k.id]?.spend ?? 0
  }

  function kanalPctBrugt(k: KanalConfig) {
    const total = k.monthlyBudget * 12 // samlet kanalbudget
    const spent = kanalBudgetTilDato(k)
    return total > 0 ? spent / total : 0
  }

  function kanalPrMaanedFremad(k: KanalConfig) {
    const kanalLeft = remainingBudget(k) - kanalBudgetTilDato(k)
    return remaining > 0 ? Math.max(kanalLeft, 0) / remaining : 0
  }

  function kanalPctAfBudget(k: KanalConfig) {
    return SAMLET_BUDGET > 0 ? (k.monthlyBudget * 12) / SAMLET_BUDGET : 0
  }

  // ── Performance calculations ───────────────────────────────────────────────

  const totals: AwarenessData = KANALER.reduce((acc, k) => {
    const d = apiData[k.id]
    return {
      spend:          acc.spend          + d.spend,
      impressions:    acc.impressions    + d.impressions,
      reach:          acc.reach          + d.reach,
      frequency:      0, // beregnes nedenfor
      videoViews25:   acc.videoViews25   + d.videoViews25,
      videoViews50:   acc.videoViews50   + d.videoViews50,
      videoViews75:   acc.videoViews75   + d.videoViews75,
      videoViews100:  acc.videoViews100  + d.videoViews100,
      completionRate: 0, // beregnes nedenfor
      cpm:            0, // beregnes nedenfor
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
                platform="linkedin"
                accounts={liAccounts.accounts}
                selectedId={liAccountId}
                isLoading={liAccounts.isLoading}
                error={liAccounts.error}
                onChange={setLiAccountId}
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
            description={`Samlet foreningsårsbudget: ${formatCurrency(SAMLET_BUDGET)} · ${remaining} måneder tilbage af foreningsåret`}
          />

          {/* Budget summary cards */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Samlet budget"       value={formatCurrency(SAMLET_BUDGET)}  sub="Hele foreningsåret" />
            <Stat label="Budget brugt til dato" value={formatCurrency(totalSpent)}   sub="Meta + LinkedIn (API)" loading={isLoading} />
            <Stat label="Budget tilbage"      value={formatCurrency(budgetLeft)}     sub={`${formatPercent(SAMLET_BUDGET > 0 ? budgetLeft / SAMLET_BUDGET : 0)} tilbage`} loading={isLoading} />
          </div>

          {/* Budget table */}
          <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <TH>Kanal</TH>
                  <TH right>Budget pr. måned</TH>
                  <TH right>Procentdel af budget</TH>
                  <TH right>Budget til dato</TH>
                  <TH right>Procentdel brugt</TH>
                  <TH right>Rest af foreningsår</TH>
                  <TH right>Pr. måned fremad</TH>
                </tr>
              </thead>
              <tbody>
                {KANALER.map((k) => {
                  const spent   = kanalBudgetTilDato(k)
                  const loading = isLoading && k.platform !== null
                  return (
                    <tr key={k.id} className="hover:bg-muted/20">
                      <TD bold>{k.name}</TD>
                      <TD right>{formatCurrency(k.monthlyBudget)}</TD>
                      <TD right muted>{formatPercent(kanalPctAfBudget(k))}</TD>
                      <TD right>
                        {loading ? <Skeleton className="ml-auto h-4 w-20" /> : formatCurrency(spent)}
                      </TD>
                      <TD right>
                        {loading ? <Skeleton className="ml-auto h-4 w-16" /> : formatPercent(kanalPctBrugt(k))}
                      </TD>
                      <TD right muted>{formatCurrency(remainingBudget(k))}</TD>
                      <TD right>
                        {loading ? <Skeleton className="ml-auto h-4 w-20" /> : formatCurrency(kanalPrMaanedFremad(k))}
                      </TD>
                    </tr>
                  )
                })}
                {/* Totals row */}
                <tr className="bg-muted/30 font-semibold">
                  <TD bold>Total</TD>
                  <TD right bold>{formatCurrency(KANALER.reduce((s, k) => s + k.monthlyBudget, 0))}</TD>
                  <TD right bold>{formatPercent(1)}</TD>
                  <TD right bold>
                    {isLoading ? <Skeleton className="ml-auto h-4 w-20" /> : formatCurrency(totalSpent)}
                  </TD>
                  <TD right bold>
                    {isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : formatPercent(SAMLET_BUDGET > 0 ? totalSpent / SAMLET_BUDGET : 0)}
                  </TD>
                  <TD right bold>{formatCurrency(totalRemBud)}</TD>
                  <TD right bold>
                    {isLoading ? <Skeleton className="ml-auto h-4 w-20" /> : formatCurrency(remaining > 0 ? Math.max(budgetLeft, 0) / remaining : 0)}
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

          {/* Performance summary cards */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Eksponeringer"    value={formatNumber(totals.impressions)} loading={isLoading} />
            <Stat label="Reach"            value={formatNumber(totals.reach)}       loading={isLoading} />
            <Stat label="Frekvens"         value={totals.frequency.toFixed(2)}      loading={isLoading} sub="eksponeringer pr. person" />
            <Stat label="CPM"              value={formatCurrency(totals.cpm)}       loading={isLoading} sub="pr. 1.000 eksponeringer" />
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
                  const loading = isLoading && k.platform !== null
                  const noApi   = k.platform === null
                  const sk = (w = 16) => <Skeleton className={`ml-auto h-4 w-${w}`} />
                  return (
                    <tr key={k.id} className="hover:bg-muted/20">
                      <TD bold>{k.name}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : formatNumber(d.reach)}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : formatNumber(d.impressions)}</TD>
                      <TD right>{loading ? sk(12) : noApi ? dash : d.frequency.toFixed(2)}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.videoViews25 > 0 ? formatNumber(d.videoViews25) : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.videoViews50 > 0 ? formatNumber(d.videoViews50) : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.videoViews75 > 0 ? formatNumber(d.videoViews75) : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : d.videoViews100 > 0 ? formatNumber(d.videoViews100) : dash}</TD>
                      <TD right>{loading ? sk(12) : noApi ? dash : d.videoViews100 > 0 ? formatPercent(d.completionRate) : dash}</TD>
                      <TD right>{loading ? sk() : noApi ? dash : formatCurrency(d.cpm)}</TD>
                    </tr>
                  )
                })}
                {/* Totals row */}
                <tr className="bg-muted/30 font-semibold">
                  <TD bold>Total</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : formatNumber(totals.reach)}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : formatNumber(totals.impressions)}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-12" /> : totals.frequency.toFixed(2)}</TD>
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
            * YouTube Ads og TV2 Play Ads vises ikke i API — tilføj data manuelt i <code className="rounded bg-muted px-1">src/lib/config/kendskabs.ts</code>
          </p>
        </section>

      </main>
    </div>
  )
}
