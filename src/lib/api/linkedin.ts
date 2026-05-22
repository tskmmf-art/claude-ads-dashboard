import type { AdAccount, AdMetrics } from '@/types'

const BASE = 'https://api.linkedin.com/rest'
const LI_VERSION = '202503'

function headers() {
  const token = process.env.LINKEDIN_ACCESS_TOKEN
  if (!token) throw new Error('LINKEDIN_ACCESS_TOKEN not set')
  return {
    Authorization: `Bearer ${token}`,
    'LinkedIn-Version': LI_VERSION,
    'X-Restli-Protocol-Version': '2.0.0',
  }
}

// Colons inside restli List() must be URL-encoded, but the List() parens stay raw
function urnParam(type: 'sponsoredAccount' | 'sponsoredCampaign', id: string) {
  return `urn%3Ali%3A${type}%3A${id}`
}

export async function fetchLinkedInAccounts(): Promise<AdAccount[]> {
  const res = await fetch(`${BASE}/adAccounts?q=search`, {
    headers: headers(),
  })
  if (!res.ok) throw new Error(`LinkedIn accounts fetch failed: ${res.status}`)
  const json = await res.json()

  return (json.elements ?? []).map((a: { id: number; name: string; currency: string }) => ({
    id: String(a.id),
    name: a.name,
    platform: 'linkedin' as const,
    currency: a.currency,
  }))
}

interface LiAnalyticsRow {
  dateRange: { start: { year: number; month: number; day: number } }
  pivotValues: string[]
  costInLocalCurrency?: string
  impressions?: number
  clicks?: number
  externalWebsiteConversions?: number
}

interface LiCampaign {
  id: number
  name: string
}

export async function fetchLinkedInInsights(
  accountId: string,
  since: string,
  until: string
): Promise<AdMetrics[]> {
  const [sy, sm, sd] = since.split('-').map(Number)
  const [ey, em, ed] = until.split('-').map(Number)

  const dateRange = `dateRange=(start:(day:${sd},month:${sm},year:${sy}),end:(day:${ed},month:${em},year:${ey}))`
  const accountParam = `accounts=List(${urnParam('sponsoredAccount', accountId)})`
  const fields = 'dateRange,costInLocalCurrency,impressions,clicks,externalWebsiteConversions,pivotValues'

  const url = `${BASE}/adAnalytics?q=analytics&pivot=CAMPAIGN&timeGranularity=DAILY&${dateRange}&${accountParam}&fields=${fields}`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) throw new Error(`LinkedIn insights fetch failed: ${res.status}`)
  const json = await res.json()

  // Fetch campaign names for the IDs we got back
  const campaignIds = Array.from(
    new Set<string>(
      (json.elements ?? []).flatMap((e: LiAnalyticsRow) =>
        (e.pivotValues ?? []).map((v) => v.replace('urn:li:sponsoredCampaign:', ''))
      )
    )
  )

  const campaignNames: Record<string, string> = {}
  if (campaignIds.length > 0) {
    // Fetch campaigns using path-based API (new in 202503)
    const cRes = await fetch(
      `${BASE}/adAccounts/${accountId}/adCampaigns?q=search&count=100`,
      { headers: headers() }
    )
    if (cRes.ok) {
      const cJson = await cRes.json()
      for (const c of (cJson.elements ?? []) as LiCampaign[]) {
        campaignNames[String(c.id)] = c.name
      }
    }
  }

  return (json.elements ?? []).map((row: LiAnalyticsRow) => {
    const d = row.dateRange?.start
    const date = d
      ? `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
      : since
    const campaignUrn = (row.pivotValues ?? [])[0] ?? ''
    const campaignId = campaignUrn.replace('urn:li:sponsoredCampaign:', '')
    const spend = parseFloat(row.costInLocalCurrency ?? '0')
    const impressions = row.impressions ?? 0
    const clicks = row.clicks ?? 0
    const conversions = row.externalWebsiteConversions ?? 0

    return {
      date,
      platform: 'linkedin' as const,
      accountId,
      accountName: `LinkedIn Account ${accountId}`,
      campaignId,
      campaignName: campaignNames[campaignId] ?? `Campaign ${campaignId}`,
      spend,
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      roas: 0,
      reach: 0,
    }
  })
}
