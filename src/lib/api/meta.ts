import type { AdAccount, AdMetrics } from '@/types'

const BASE = 'https://graph.facebook.com/v19.0'

function token() {
  const t = process.env.META_ACCESS_TOKEN
  if (!t) throw new Error('META_ACCESS_TOKEN not set')
  return t
}

export async function fetchMetaAccounts(): Promise<AdAccount[]> {
  const res = await fetch(`${BASE}/me/adaccounts?fields=id,name,currency&limit=100&access_token=${token()}`)
  if (!res.ok) throw new Error(`Meta accounts fetch failed: ${res.status}`)
  const json = await res.json()
  return (json.data ?? []).map((a: { id: string; name: string; currency: string }) => ({
    id: a.id,
    name: a.name,
    platform: 'meta' as const,
    currency: a.currency,
  }))
}

export async function fetchMetaInsights(
  accountId: string,
  since: string,
  until: string
): Promise<AdMetrics[]> {
  const params = new URLSearchParams({
    fields: 'campaign_id,campaign_name,spend,impressions,reach,clicks,actions,action_values,account_id,account_name',
    time_range: JSON.stringify({ since, until }),
    time_increment: '1',
    level: 'campaign',
    limit: '500',           // max rows per page
    access_token: token(),
  })

  // ── Cursor-based pagination ─────────────────────────────────────────────
  const allRows: Record<string, unknown>[] = []
  let nextUrl: string | null = `${BASE}/${accountId}/insights?${params}`

  while (nextUrl) {
    const currentUrl: string = nextUrl
    nextUrl = null
    const r: Response = await fetch(currentUrl)
    if (!r.ok) throw new Error(`Meta insights fetch failed: ${r.status}`)
    const j: { data?: Record<string, unknown>[]; paging?: { next?: string } } = await r.json()
    allRows.push(...(j.data ?? []))
    nextUrl = j.paging?.next ?? null
  }

  return allRows.map((row) => {
    const spend = parseFloat(row.spend as string) || 0
    const impressions = parseInt(row.impressions as string) || 0
    const reach = parseInt(row.reach as string) || 0
    const clicks = parseInt(row.clicks as string) || 0

    const actions = (row.actions as Array<{ action_type: string; value: string }>) ?? []
    const linkClicks = parseInt(
      actions.find((a) => a.action_type === 'link_click')?.value ?? '0'
    )
    const conversions =
      actions.find((a) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value
      ?? actions.find((a) => a.action_type === 'purchase')?.value
      ?? '0'

    const actionValues = (row.action_values as Array<{ action_type: string; value: string }>) ?? []
    const revenue = parseFloat(
      actionValues.find((a) => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value
      ?? actionValues.find((a) => a.action_type === 'purchase')?.value
      ?? '0'
    )

    return {
      date: row.date_start as string,
      platform: 'meta' as const,
      accountId: row.account_id as string,
      accountName: row.account_name as string,
      campaignId: row.campaign_id as string,
      campaignName: row.campaign_name as string,
      spend,
      impressions,
      clicks,
      linkClicks,
      conversions: parseFloat(conversions),
      ctr: impressions > 0 ? clicks / impressions : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      roas: spend > 0 ? revenue / spend : 0,
      reach,
    }
  })
}
