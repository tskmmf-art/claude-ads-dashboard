import type { AdAccount, AdMetrics } from '@/types'

const BASE = 'https://googleads.googleapis.com/v16'

function headers() {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const accessToken = process.env.GOOGLE_ADS_ACCESS_TOKEN
  if (!devToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not set')
  if (!accessToken) throw new Error('GOOGLE_ADS_ACCESS_TOKEN not set')
  return {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': devToken,
    'Content-Type': 'application/json',
  }
}

function customerId() {
  const id = process.env.GOOGLE_ADS_CUSTOMER_ID
  if (!id) throw new Error('GOOGLE_ADS_CUSTOMER_ID not set')
  return id.replace(/-/g, '')
}

export async function fetchGoogleAccounts(): Promise<AdAccount[]> {
  const cid = customerId()
  const query = `SELECT customer_client.id, customer_client.descriptive_name, customer_client.currency_code FROM customer_client WHERE customer_client.status = 'ENABLED'`

  const res = await fetch(`${BASE}/customers/${cid}/googleAds:search`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Ads accounts fetch failed: ${res.status} ${err}`)
  }

  const json = await res.json()
  return (json.results ?? []).map((r: { customerClient: { id: string; descriptiveName: string; currencyCode: string } }) => ({
    id: r.customerClient.id,
    name: r.customerClient.descriptiveName,
    platform: 'google' as const,
    currency: r.customerClient.currencyCode,
  }))
}

export async function fetchGoogleInsights(
  accountId: string,
  since: string,
  until: string
): Promise<AdMetrics[]> {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      customer.id,
      customer.descriptive_name,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value,
      segments.date
    FROM campaign
    WHERE segments.date BETWEEN '${since}' AND '${until}'
      AND campaign.status = 'ENABLED'
    ORDER BY segments.date ASC
  `

  const res = await fetch(`${BASE}/customers/${accountId}/googleAds:search`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Ads insights fetch failed: ${res.status} ${err}`)
  }

  const json = await res.json()

  return (json.results ?? []).map((r: {
    campaign: { id: string; name: string }
    customer: { id: string; descriptiveName: string }
    metrics: { costMicros: string; impressions: string; clicks: string; conversions: string; conversionsValue: string }
    segments: { date: string }
  }) => {
    const spend = parseInt(r.metrics.costMicros ?? '0') / 1_000_000
    const impressions = parseInt(r.metrics.impressions ?? '0')
    const clicks = parseInt(r.metrics.clicks ?? '0')
    const conversions = parseFloat(r.metrics.conversions ?? '0')
    const revenue = parseFloat(r.metrics.conversionsValue ?? '0')

    return {
      date: r.segments.date,
      platform: 'google' as const,
      accountId: r.customer.id,
      accountName: r.customer.descriptiveName,
      campaignId: r.campaign.id,
      campaignName: r.campaign.name,
      spend,
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      roas: spend > 0 ? revenue / spend : 0,
      reach: 0,
    }
  })
}
