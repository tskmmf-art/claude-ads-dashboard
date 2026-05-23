import type { AdAccount, AdMetrics } from '@/types'

const BASE = 'https://googleads.googleapis.com/v20'

// ── OAuth: exchange refresh token for access token ────────────────────────────

async function getAccessToken(): Promise<string> {
  const clientId     = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN

  if (!clientId)     throw new Error('GOOGLE_ADS_CLIENT_ID not set')
  if (!clientSecret) throw new Error('GOOGLE_ADS_CLIENT_SECRET not set')
  if (!refreshToken) throw new Error('GOOGLE_ADS_REFRESH_TOKEN not set')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google OAuth token exchange failed: ${res.status} ${err}`)
  }

  const json = await res.json()
  if (!json.access_token) throw new Error('No access_token in Google OAuth response')
  return json.access_token as string
}

// ── Base headers (no login-customer-id) ──────────────────────────────────────

async function buildHeaders(loginCustomerId?: string): Promise<Record<string, string>> {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not set')

  const accessToken = await getAccessToken()
  const headers: Record<string, string> = {
    Authorization:     `Bearer ${accessToken}`,
    'developer-token': devToken,
    'Content-Type':    'application/json',
  }
  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId
  }
  return headers
}

// ── Accounts: discover all non-manager accessible customers ──────────────────

export async function fetchGoogleAccounts(): Promise<AdAccount[]> {
  const headers = await buildHeaders()

  // Step 1: list all accessible customer IDs
  const listRes = await fetch(`${BASE}/customers:listAccessibleCustomers`, {
    method: 'GET',
    headers,
  })
  if (!listRes.ok) {
    const err = await listRes.text()
    throw new Error(`Google Ads listAccessibleCustomers failed: ${listRes.status} ${err}`)
  }
  const listJson = await listRes.json()
  const resourceNames: string[] = listJson.resourceNames ?? []

  if (resourceNames.length === 0) return []

  // Step 2: for each customer, fetch name + manager flag
  const accounts: AdAccount[] = []

  for (const resourceName of resourceNames) {
    const cid = resourceName.replace('customers/', '')
    try {
      const res = await fetch(`${BASE}/customers/${cid}/googleAds:search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: 'SELECT customer.id, customer.descriptive_name, customer.manager, customer.currency_code FROM customer LIMIT 1',
        }),
      })
      if (!res.ok) continue
      const json = await res.json()
      const customer = json.results?.[0]?.customer
      if (!customer || customer.manager) continue   // skip manager accounts

      accounts.push({
        id:       customer.id,
        name:     customer.descriptiveName ?? `Konto ${customer.id}`,
        platform: 'google' as const,
        currency: customer.currencyCode ?? 'DKK',
      })
    } catch {
      // skip accounts we can't access
    }
  }

  return accounts
}

// ── Insights ──────────────────────────────────────────────────────────────────

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
      AND campaign.status != 'REMOVED'
    ORDER BY segments.date ASC
  `

  const headers = await buildHeaders()

  const res = await fetch(`${BASE}/customers/${accountId}/googleAds:search`, {
    method: 'POST',
    headers,
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
    metrics: {
      costMicros: string
      impressions: string
      clicks: string
      conversions: string
      conversionsValue: string
    }
    segments: { date: string }
  }) => {
    const spend       = parseInt(r.metrics.costMicros ?? '0') / 1_000_000
    const impressions = parseInt(r.metrics.impressions ?? '0')
    const clicks      = parseInt(r.metrics.clicks ?? '0')
    const conversions = parseFloat(r.metrics.conversions ?? '0')
    const revenue     = parseFloat(r.metrics.conversionsValue ?? '0')

    return {
      date:         r.segments.date,
      platform:     'google' as const,
      accountId:    r.customer.id,
      accountName:  r.customer.descriptiveName,
      campaignId:   r.campaign.id,
      campaignName: r.campaign.name,
      spend,
      impressions,
      clicks,
      linkClicks:   clicks,
      conversions,
      ctr:          impressions > 0 ? clicks / impressions : 0,
      cpc:          clicks > 0 ? spend / clicks : 0,
      roas:         spend > 0 ? revenue / spend : 0,
      reach:        0,
    }
  })
}
