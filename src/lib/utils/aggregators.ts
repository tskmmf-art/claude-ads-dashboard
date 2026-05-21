import type { AdMetrics, KpiTotals } from '@/types'

export function computeKpiTotals(data: AdMetrics[]): KpiTotals {
  if (data.length === 0) {
    return { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, roas: 0 }
  }

  const totals = data.reduce(
    (acc, row) => ({
      spend: acc.spend + row.spend,
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      conversions: acc.conversions + row.conversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  )

  return {
    ...totals,
    ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    roas: totals.spend > 0 ? data.reduce((acc, r) => acc + r.roas * r.spend, 0) / totals.spend : 0,
  }
}

export interface DailySpend {
  date: string
  meta: number
  google: number
  linkedin: number
  total: number
}

export function aggregateDailySpend(data: AdMetrics[]): DailySpend[] {
  const byDate: Record<string, DailySpend> = {}

  for (const row of data) {
    if (!byDate[row.date]) {
      byDate[row.date] = { date: row.date, meta: 0, google: 0, linkedin: 0, total: 0 }
    }
    byDate[row.date][row.platform] += row.spend
    byDate[row.date].total += row.spend
  }

  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))
}

export interface PlatformBreakdown {
  platform: string
  spend: number
  color: string
}

const PLATFORM_COLORS: Record<string, string> = {
  meta: '#1877F2',
  google: '#34A853',
  linkedin: '#0A66C2',
}

export function aggregatePlatformBreakdown(data: AdMetrics[]): PlatformBreakdown[] {
  const byPlatform: Record<string, number> = {}

  for (const row of data) {
    byPlatform[row.platform] = (byPlatform[row.platform] ?? 0) + row.spend
  }

  return Object.entries(byPlatform).map(([platform, spend]) => ({
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    spend,
    color: PLATFORM_COLORS[platform] ?? '#888',
  }))
}

export function aggregateCampaigns(data: AdMetrics[]): AdMetrics[] {
  const byKey: Record<string, AdMetrics> = {}

  for (const row of data) {
    const key = `${row.platform}__${row.campaignId}`
    if (!byKey[key]) {
      byKey[key] = { ...row }
    } else {
      const acc = byKey[key]
      const newSpend = acc.spend + row.spend
      const newImpressions = acc.impressions + row.impressions
      const newClicks = acc.clicks + row.clicks
      const newConversions = acc.conversions + row.conversions
      byKey[key] = {
        ...acc,
        spend: newSpend,
        impressions: newImpressions,
        clicks: newClicks,
        conversions: newConversions,
        ctr: newImpressions > 0 ? newClicks / newImpressions : 0,
        cpc: newClicks > 0 ? newSpend / newClicks : 0,
        roas: newSpend > 0 ? (acc.roas * acc.spend + row.roas * row.spend) / newSpend : 0,
      }
    }
  }

  return Object.values(byKey).sort((a, b) => b.spend - a.spend)
}
