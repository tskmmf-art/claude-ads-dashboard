'use client'

import * as React from 'react'
import { differenceInDays } from 'date-fns'
import type { Platform, PlatformState } from '@/types'
import { useAccounts, usePlatformInsights } from '@/hooks/useAdsData'
import { useDateRange } from '@/hooks/useDateRange'
import {
  computeKpiTotals,
  aggregateDailySpend,
  aggregateDailyMetrics,
  aggregatePlatformBreakdown,
  aggregateCampaigns,
} from '@/lib/utils/aggregators'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/formatters'
import { PlatformFilter } from '@/components/filters/PlatformFilter'
import { AccountSelector } from '@/components/filters/AccountSelector'
import { DateRangePicker } from '@/components/filters/DateRangePicker'
import { KpiCards } from '@/components/KpiCards'
import { SpendChart } from '@/components/charts/SpendChart'
import { DualLineChart } from '@/components/charts/DualLineChart'
import { PerformanceChart } from '@/components/charts/PerformanceChart'
import { CampaignTable } from '@/components/CampaignTable'

const PLATFORMS: Platform[] = ['meta', 'google', 'linkedin']

const defaultPlatformStates = (): Record<Platform, PlatformState> => ({
  meta: { enabled: true, selectedAccountId: null },
  google: { enabled: true, selectedAccountId: null },
  linkedin: { enabled: true, selectedAccountId: null },
})

export default function DashboardPage() {
  const { dateRange, setDateRange } = useDateRange()
  const [platformStates, setPlatformStates] = React.useState<Record<Platform, PlatformState>>(
    defaultPlatformStates
  )

  function togglePlatform(platform: Platform, enabled: boolean) {
    setPlatformStates((s) => ({ ...s, [platform]: { ...s[platform], enabled } }))
  }

  function selectAccount(platform: Platform, id: string) {
    setPlatformStates((s) => ({ ...s, [platform]: { ...s[platform], selectedAccountId: id } }))
  }

  const meta = useAccounts('meta', platformStates.meta.enabled)
  const google = useAccounts('google', platformStates.google.enabled)
  const linkedin = useAccounts('linkedin', platformStates.linkedin.enabled)

  React.useEffect(() => {
    if (meta.accounts.length > 0 && !platformStates.meta.selectedAccountId)
      selectAccount('meta', meta.accounts[0].id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.accounts])

  React.useEffect(() => {
    if (google.accounts.length > 0 && !platformStates.google.selectedAccountId)
      selectAccount('google', google.accounts[0].id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google.accounts])

  React.useEffect(() => {
    if (linkedin.accounts.length > 0 && !platformStates.linkedin.selectedAccountId)
      selectAccount('linkedin', linkedin.accounts[0].id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedin.accounts])

  const metaData = usePlatformInsights('meta', platformStates.meta.selectedAccountId, dateRange, platformStates.meta.enabled)
  const googleData = usePlatformInsights('google', platformStates.google.selectedAccountId, dateRange, platformStates.google.enabled)
  const linkedinData = usePlatformInsights('linkedin', platformStates.linkedin.selectedAccountId, dateRange, platformStates.linkedin.enabled)

  const allData = [...metaData.data, ...googleData.data, ...linkedinData.data]
  const isLoading = metaData.isLoading || googleData.isLoading || linkedinData.isLoading

  const days = Math.max(differenceInDays(dateRange.to, dateRange.from) + 1, 1)
  const totals = computeKpiTotals(allData, days)
  const dailySpend = aggregateDailySpend(allData)
  const dailyMetrics = aggregateDailyMetrics(allData)
  const platformBreakdown = aggregatePlatformBreakdown(allData)
  const campaigns = aggregateCampaigns(allData)
  const activePlatforms = PLATFORMS.filter((p) => platformStates[p].enabled)

  const accountSelectors: { platform: Platform; hook: ReturnType<typeof useAccounts> }[] = [
    { platform: 'meta', hook: meta },
    { platform: 'google', hook: google },
    { platform: 'linkedin', hook: linkedin },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h1 className="text-base font-bold leading-tight">Ads Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Meta · LinkedIn
              </p>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              <PlatformFilter platforms={platformStates} onChange={togglePlatform} />
              {accountSelectors.map(({ platform, hook }) =>
                platformStates[platform].enabled ? (
                  <AccountSelector
                    key={platform}
                    platform={platform}
                    accounts={hook.accounts}
                    selectedId={platformStates[platform].selectedAccountId}
                    isLoading={hook.isLoading}
                    error={hook.error}
                    onChange={(id) => selectAccount(platform, id)}
                  />
                ) : null
              )}
            </div>
            <DateRangePicker dateRange={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </header>

      {/* Error banners */}
      <div className="mx-auto max-w-screen-2xl px-6">
        {[
          { platform: 'meta' as Platform, err: metaData.error },
          { platform: 'google' as Platform, err: googleData.error },
          { platform: 'linkedin' as Platform, err: linkedinData.error },
        ]
          .filter((x) => x.err)
          .map(({ platform, err }) => (
            <div key={platform} className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
              {platform}: {err?.message}
            </div>
          ))}
      </div>

      <main className="mx-auto max-w-screen-2xl space-y-4 p-6">
        {/* KPI cards — 2 rows */}
        <KpiCards totals={totals} isLoading={isLoading} days={days} />

        {/* Dual charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DualLineChart
            title="Impressions & Reach"
            data={dailyMetrics}
            isLoading={isLoading}
            lines={[
              {
                key: 'impressions',
                label: 'Impressions',
                color: '#1877F2',
                yAxisId: 'left',
                formatter: formatNumber,
              },
              {
                key: 'reach',
                label: 'Reach',
                color: '#e05252',
                yAxisId: 'right',
                formatter: formatNumber,
              },
            ]}
          />
          <DualLineChart
            title="Klik & CPC"
            data={dailyMetrics}
            isLoading={isLoading}
            lines={[
              {
                key: 'clicks',
                label: 'Klik',
                color: '#f59e0b',
                yAxisId: 'left',
                formatter: formatNumber,
              },
              {
                key: 'cpc',
                label: 'CPC',
                color: '#8b5cf6',
                yAxisId: 'right',
                formatter: formatCurrency,
              },
            ]}
          />
        </div>

        {/* Spend dynamics — full width */}
        <SpendChart
          data={dailySpend}
          isLoading={isLoading}
          activePlatforms={activePlatforms}
        />

        {/* Campaign table — full width */}
        <CampaignTable data={campaigns} isLoading={isLoading} />

        {/* Platform breakdown + CTR */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PerformanceChart data={platformBreakdown} isLoading={isLoading} />
          <div className="col-span-2 rounded-xl border bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold">Platform fordeling — klik & CTR</p>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded bg-muted" />)}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="pb-2 text-left">Platform</th>
                    <th className="pb-2 text-right">Forbrug</th>
                    <th className="pb-2 text-right">Impressions</th>
                    <th className="pb-2 text-right">Klik</th>
                    <th className="pb-2 text-right">CTR</th>
                    <th className="pb-2 text-right">CPC</th>
                  </tr>
                </thead>
                <tbody>
                  {(['meta', 'google', 'linkedin'] as Platform[])
                    .filter((p) => platformStates[p].enabled)
                    .map((p) => {
                      const rows = allData.filter((r) => r.platform === p)
                      if (rows.length === 0) return null
                      const spend = rows.reduce((a, r) => a + r.spend, 0)
                      const imp = rows.reduce((a, r) => a + r.impressions, 0)
                      const clicks = rows.reduce((a, r) => a + r.clicks, 0)
                      const ctr = imp > 0 ? clicks / imp : 0
                      const cpc = clicks > 0 ? spend / clicks : 0
                      return (
                        <tr key={p} className="border-b last:border-0">
                          <td className="py-2 font-medium capitalize">{p}</td>
                          <td className="py-2 text-right tabular-nums">{formatCurrency(spend)}</td>
                          <td className="py-2 text-right tabular-nums">{formatNumber(imp)}</td>
                          <td className="py-2 text-right tabular-nums">{formatNumber(clicks)}</td>
                          <td className="py-2 text-right tabular-nums">{formatPercent(ctr)}</td>
                          <td className="py-2 text-right tabular-nums">{formatCurrency(cpc)}</td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
