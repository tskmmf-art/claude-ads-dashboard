export type Platform = 'meta' | 'google' | 'linkedin'

export interface AdMetrics {
  date: string
  platform: Platform
  accountId: string
  accountName: string
  campaignId: string
  campaignName: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  roas: number
}

export interface AdAccount {
  id: string
  name: string
  platform: Platform
  currency: string
}

export interface DateRange {
  from: Date
  to: Date
}

export interface PlatformState {
  enabled: boolean
  selectedAccountId: string | null
}

export interface DashboardFilters {
  dateRange: DateRange
  platforms: Record<Platform, PlatformState>
}

export interface KpiTotals {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  roas: number
}
