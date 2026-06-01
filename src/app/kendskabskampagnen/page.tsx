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

// ─── Generisk inline-editor ───────────────────────────────────────────────────

function ManualCell({ value, onSave, display, placeholder = '— indtast', inputWidth = 'w-24' }: {
  value: number
  onSave: (v: number) => void
  display: (v: number) => string
  placeholder?: string
  inputWidth?: string
}) {
  const [editing, setEditing] = React.useState(false)
  const [draft,   setDraft]   = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  function open() {
    setDraft(value > 0 ? String(value) : '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commit() {
    const n = parseFloat(draft.replace(/[^\d.,]/g, '').replace(',', '.'))
    onSave(isNaN(n) ? 0 : n)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className={`${inputWidth} border-0 border-b-2 border-blue-400 bg-transparent text-right text-sm tabular-nums outline-none`}
      />
    )
  }

  return (
    <button
      onClick={open}
      className={`group inline-flex items-center justify-end gap-1 text-right text-sm tabular-nums transition hover:text-blue-600 ${value > 0 ? '' : 'text-muted-foreground/40'}`}
    >
      <svg className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
      </svg>
      {value > 0 ? display(value) : placeholder}
    </button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const empty: AwarenessData = {
  spend: 0, impressions: 0, coviewedImpressions: 0, reach: 0, frequency: 0,
  linkClicks: 0,
  videoViews25: 0, videoViews50: 0, videoViews75: 0, videoViews100: 0,
  completionRate: 0, cpm: 0,
}

const KAMPAGNE_RANGE: DateRange = {
  from: KAMPAGNE_PERIODE.start,
  to:   KAMPAGNE_PERIODE.end,
}

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

  // Manuel reach pr. kanal (YouTube) — gemmes i localStorage
  const [manualReaches, setManualReaches] = React.useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem('kendskab_manual_reaches') ?? '{}') }
    catch { return {} }
  })
  function saveReach(kanalId: string, value: number) {
    const updated = { ...manualReaches, [kanalId]: value }
    setManualReaches(updated)
    localStorage.setItem('kendskab_manual_reaches', JSON.stringify(updated))
  }
  function getReach(k: KanalConfig): number {
    if (manualReaches[k.id] !== undefined) return manualReaches[k.id]
    return k.manualReach ?? 0
  }

  // Manuel TV2 Play data — alle felter redigerbare, præ-udfyldt fra TV2 Connect screenshot
  interface Tv2Data { spend: number; impressions: number; reach: number; cpm: number; completionRate: number }
  const TV2_DEFAULTS: Tv2Data = { spend: 48000, impressions: 140883, reach: 69639, cpm: 269.86, completionRate: 0.9763 }
  const [tv2Data, setTv2Data] = React.useState<Tv2Data>(() => {
    if (typeof window === 'undefined') return TV2_DEFAULTS
    try {
      const stored = localStorage.getItem('kendskab_tv2_data')
      return stored ? { ...TV2_DEFAULTS, ...JSON.parse(stored) } : TV2_DEFAULTS
    } catch { return TV2_DEFAULTS }
  })
  function saveTv2Field(field: keyof Tv2Data, value: number) {
    const updated = { ...tv2Data, [field]: value }
    setTv2Data(updated)
    localStorage.setItem('kendskab_tv2_data', JSON.stringify(updated))
  }

  const metaAccounts   = useAccounts('meta',   true)
  const googleAccounts = useAccounts('google', true)

  React.useEffect(() => {
    if (metaAccounts.accounts.length > 0 && !metaAccountId) {
      const preferred = metaAccounts.accounts.find(a =>
        a.name.toLowerCase().includes('ekstern branding')
      )
      setMetaAccountId((preferred ?? metaAccounts.accounts[0]).id)
    }
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

  const [performanceRevealed, setPerformanceRevealed] = React.useState(false)

  // Anvend manualReach på kanaler der har det sat — overskriver API-reach og genberegner frekvens
  // For Google/YouTube bruges coviewedImpressions (samsening) som tæller i frekvensberegningen
  function applyManualReach(base: AwarenessData, kanal: KanalConfig): AwarenessData {
    const manual = getReach(kanal)
    const reach  = manual > 0 ? manual : base.reach
    const impressionsForFreq = kanal.platform === 'google'
      ? base.coviewedImpressions
      : base.impressions
    return {
      ...base,
      reach,
      frequency: reach > 0 ? impressionsForFreq / reach : base.frequency,
    }
  }

  // TV2 Play: byg AwarenessData fra manuelt indtastede tal
  const tv2AwarenessData: AwarenessData = {
    ...empty,
    spend:          tv2Data.spend,
    impressions:    tv2Data.impressions,
    reach:          tv2Data.reach,
    frequency:      tv2Data.reach > 0 ? tv2Data.impressions / tv2Data.reach : 0,
    cpm:            tv2Data.cpm,
    completionRate: tv2Data.completionRate,
    videoViews100:  Math.round(tv2Data.impressions * tv2Data.completionRate),
  }

  // Map kanal-id → AwarenessData (youtube bruger Google Ads API, tv2play er manuel)
  const rawData: Record<string, AwarenessData> = {
    meta:    metaAwareness.data,
    youtube: googleAwareness.data,
    tv2play: tv2AwarenessData,
  }
  const apiData: Record<string, AwarenessData> = Object.fromEntries(
    KANALER.map(k => [k.id, applyManualReach(rawData[k.id] ?? empty, k)])
  )

  // ── Budget ────────────────────────────────────────────────────────────────

  const totalSpent = apiData['meta'].spend + apiData['youtube'].spend + apiData['tv2play'].spend
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
      spend:               acc.spend               + d.spend,
      impressions:         acc.impressions         + d.impressions,
      coviewedImpressions: acc.coviewedImpressions + d.coviewedImpressions,
      reach:               acc.reach               + d.reach,
      frequency:           0,
      linkClicks:          acc.linkClicks          + d.linkClicks,
      videoViews25:        acc.videoViews25        + d.videoViews25,
      videoViews50:        acc.videoViews50        + d.videoViews50,
      videoViews75:        acc.videoViews75        + d.videoViews75,
      videoViews100:       acc.videoViews100       + d.videoViews100,
      completionRate:      0,
      cpm:                 0,
    }
  }, { ...empty })
  totals.frequency      = totals.reach > 0 ? totals.impressions / totals.reach : 0
  totals.completionRate = totals.impressions > 0 ? totals.videoViews100 / totals.impressions : 0
  totals.cpm            = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0

  const dash = <span className="text-muted-foreground/50">—</span>

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-base font-bold flex items-center gap-2">
              <span className="inline-block h-4 w-1 rounded-none bg-mmf-red" />
              Kendskabskampagnen
            </h1>
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
            <Stat label="Samlet budget"         value={formatCurrency(SAMLET_BUDGET)}  sub="Maj–juni 2026"         accent="#B5AE8E" />
            <Stat label="Budget brugt til dato" value={formatCurrency(totalSpent)}      sub="Meta + Google (API)"   accent="#B5AE8E" loading={isLoading} />
            <Stat label="Budget tilbage"        value={formatCurrency(budgetLeft)}      sub={formatPercent(SAMLET_BUDGET > 0 ? budgetLeft / SAMLET_BUDGET : 0) + ' tilbage'} accent="#B5AE8E" loading={isLoading} />
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
                          : k.id === 'tv2play'
                            ? <ManualCell value={tv2Data.spend} onSave={v => saveTv2Field('spend', v)} display={formatCurrency} />
                            : k.platform ? formatCurrency(spent) : dash}
                      </TD>
                      <TD right>
                        {loading
                          ? <Skeleton className="ml-auto h-4 w-16" />
                          : (k.platform || k.id === 'tv2play') && k.budget > 0 ? formatPercent(kanalPctBrugt(k)) : dash}
                      </TD>
                      <TD right muted>
                        {k.platform || k.id === 'tv2play'
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
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={() => setPerformanceRevealed(v => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                performanceRevealed
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              }`}
            >
              {performanceRevealed ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                  Skjul resultater
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Vis resultater
                </>
              )}
            </button>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">Performance</h2>
              <p className="text-xs text-muted-foreground">Reach, eksponeringer og videovisninger pr. kanal</p>
            </div>
          </div>

          <div className={`transition-all duration-300 ${performanceRevealed ? '' : 'select-none blur-sm pointer-events-none'}`}>

          {/* Summary cards */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Eksponeringer" value={formatNumber(totals.impressions)}                          loading={isLoading} accent="#D80070" />
            <Stat label="Reach"         value={totals.reach > 0 ? formatNumber(totals.reach) : '—'}      loading={isLoading} accent="#D80070" />
            <Stat label="Frekvens"      value={totals.frequency > 0 ? totals.frequency.toFixed(2) : '—'} loading={isLoading} sub="eksponeringer pr. person" accent="#D80070" />
            <Stat label="CPM"           value={formatCurrency(totals.cpm)}                                loading={isLoading} sub="pr. 1.000 eksponeringer"  accent="#D80070" />
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
                  const isTv2   = k.id === 'tv2play'
                  const sk      = () => <Skeleton className="ml-auto h-4 w-16" />
                  return (
                    <tr key={k.id} className="hover:bg-muted/20">
                      <TD bold>{k.name}</TD>
                      {/* Reach */}
                      <TD right>
                        {loading ? sk() : isTv2
                          ? <ManualCell value={tv2Data.reach} onSave={v => saveTv2Field('reach', v)} display={formatNumber} />
                          : k.manualReach !== undefined
                            ? <ManualCell value={getReach(k)} onSave={v => saveReach(k.id, v)} display={formatNumber} />
                            : d.reach > 0 ? formatNumber(d.reach) : dash}
                      </TD>
                      {/* Eksponeringer */}
                      <TD right>
                        {loading ? sk() : isTv2
                          ? <ManualCell value={tv2Data.impressions} onSave={v => saveTv2Field('impressions', Math.round(v))} display={formatNumber} />
                          : formatNumber(k.platform === 'google' ? d.coviewedImpressions : d.impressions)}
                      </TD>
                      {/* Frekvens — beregnet */}
                      <TD right>{loading ? sk() : d.frequency > 0 ? d.frequency.toFixed(2) : dash}</TD>
                      {/* Klik på link */}
                      <TD right>{loading ? sk() : isTv2 ? dash : d.linkClicks > 0 ? formatNumber(d.linkClicks) : dash}</TD>
                      {/* Video-kvartiler */}
                      <TD right>{loading ? sk() : isTv2 ? dash : d.videoViews25  > 0 ? formatNumber(d.videoViews25)  : dash}</TD>
                      <TD right>{loading ? sk() : isTv2 ? dash : d.videoViews50  > 0 ? formatNumber(d.videoViews50)  : dash}</TD>
                      <TD right>{loading ? sk() : isTv2 ? dash : d.videoViews75  > 0 ? formatNumber(d.videoViews75)  : dash}</TD>
                      <TD right>{loading ? sk() : d.videoViews100 > 0 ? formatNumber(d.videoViews100) : dash}</TD>
                      {/* Completion rate */}
                      <TD right>
                        {loading ? sk() : isTv2
                          ? <ManualCell value={tv2Data.completionRate * 100} onSave={v => saveTv2Field('completionRate', v / 100)} display={v => formatPercent(v / 100)} inputWidth="w-20" />
                          : d.videoViews100 > 0 ? formatPercent(d.completionRate) : dash}
                      </TD>
                      {/* CPM */}
                      <TD right>
                        {loading ? sk() : isTv2
                          ? <ManualCell value={tv2Data.cpm} onSave={v => saveTv2Field('cpm', v)} display={formatCurrency} />
                          : formatCurrency(d.cpm)}
                      </TD>
                    </tr>
                  )
                })}
                {/* Total */}
                <tr className="bg-muted/30">
                  <TD bold>Total</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : totals.reach > 0 ? formatNumber(totals.reach) : dash}</TD>
                  <TD right bold>{isLoading ? <Skeleton className="ml-auto h-4 w-16" /> : formatNumber(totals.impressions - apiData['youtube'].impressions + apiData['youtube'].coviewedImpressions)}</TD>
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
            * TV2 Play og YouTube reach opdateres manuelt — klik på et tal for at redigere det · Google Ads reach er ikke tilgængeligt via standard API
          </p>
          </div>
        </section>

      </main>
    </div>
  )
}
