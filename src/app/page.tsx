'use client'

import * as React from 'react'
import type { Platform, PlatformState } from '@/types'
import { useAccounts, usePlatformInsights } from '@/hooks/useAdsData'
import { useDateRange } from '@/hooks/useDateRange'
import { computeKpiTotals, aggregateDailySpend, aggregatePlatformBreakdown, aggregateCampaigns } from '@/lib/utils/aggregators'
import { PlatformFilter } from '@/components/filters/PlatformFilter'
import { AccountSelector } from '@/components/filters/AccountSelector'
import { DateRangePicker } from '@/components/filters/DateRangePicker'
import { KpiCards } from '@/components/KpiCards'
import { SpendChart } from '@/components/charts/SpendChart'
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
    if (meta.accounts.length > 0 && !platformStates.meta.selectedAccountId) {
      selectAccount('meta', meta.accounts[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.accounts])

  React.useEffect(() => {
    if (google.accounts.length > 0 && !platformStates.google.selectedAccountId) {
      selectAccount('google', google.accounts[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google.accounts])

  React.useEffect(() => {
    if (linkedin.accounts.length > 0 && !platformStates.linkedin.selectedAccountId) {
      selectAccount('linkedin', linkedin.accounts[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedin.accounts])

  const metaData = usePlatformInsights('meta', platformStates.meta.selectedAccountId, dateRange, platformStates.meta.enabled)
  const googleData = usePlatformInsights('google', platformStates.google.selectedAccountId, dateRange, platformStates.google.enabled)
  const linkedinData = usePlatformInsights('linkedin', platformStates.linkedin.selectedAccountId, dateRange, platformStates.linkedin.enabled)

  const allData = [...metaData.data, ...googleData.data, ...linkedinData.data]
  const isLoading = metaData.isLoading || googleData.isLoading || linkedinData.isLoading

  const totals = computeKpiTotals(allData)
  const dailySpend = aggregateDailySpend(allData)
  const platformBreakdown = aggregatePlatformBreakdown(allData)
  const campaigns = aggregateCampaigns(allData)

  const activePlatforms = PLATFORMS.filter((p) => platformStates[p].enabled)

  const accountSelectors: { platform: Platform; hook: ReturnType<typeof useAccounts> }[] = [
    { platform: 'meta', hook: meta },
    { platform: 'google', hook: google },
    { platform: 'linkedin', hook: linkedin },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight">Ads Dashboard</h1>
            <div className="flex flex-1 flex-wrap items-center gap-3">
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

      <main className="mx-auto max-w-screen-2xl space-y-6 p-6">
        <KpiCards totals={totals} isLoading={isLoading} />
        <CampaignTable data={campaigns} isLoading={isLoading} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SpendChart data={dailySpend} isLoading={isLoading} activePlatforms={activePlatforms} />
          <PerformanceChart data={platformBreakdown} isLoading={isLoading} />
        </div>

      </main>
    </div>
  )
}
