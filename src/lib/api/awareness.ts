// Awareness-specifikke API-kald: henter video-metrics + reach aggregeret for perioden

const META_BASE = 'https://graph.facebook.com/v19.0'
const LI_BASE   = 'https://api.linkedin.com/rest'
const LI_VER    = '202503'

function metaToken() {
  const t = process.env.META_ACCESS_TOKEN
  if (!t) throw new Error('META_ACCESS_TOKEN not set')
  return t
}

function liHeaders() {
  const t = process.env.LINKEDIN_ACCESS_TOKEN
  if (!t) throw new Error('LINKEDIN_ACCESS_TOKEN not set')
  return {
    Authorization: `Bearer ${t}`,
    'LinkedIn-Version': LI_VER,
    'X-Restli-Protocol-Version': '2.0.0',
  }
}

export interface AwarenessData {
  spend:               number
  impressions:         number
  coviewedImpressions: number   // Google Ads: metrics.coviewed_impressions (samsening)
  reach:               number
  frequency:           number   // impressions / reach
  linkClicks:          number
  videoViews25:        number
  videoViews50:        number
  videoViews75:        number
  videoViews100:       number
  completionRate:      number   // videoViews100 / impressions
  cpm:                 number   // spend / impressions * 1000
}

// ── Meta ─────────────────────────────────────────────────────────────────────

function extractVideoAction(
  arr: Array<{ action_type: string; value: string }> | undefined,
  type: string
): number {
  return parseInt(arr?.find(a => a.action_type === type)?.value ?? '0') || 0
}

export async function fetchMetaAwareness(
  accountId: string,
  since: string,
  until: string
): Promise<AwarenessData> {
  const params = new URLSearchParams({
    fields: [
      'spend',
      'impressions',
      'reach',
      'actions',
      'video_p25_watched_actions',
      'video_p50_watched_actions',
      'video_p75_watched_actions',
      'video_p100_watched_actions',
    ].join(','),
    time_range: JSON.stringify({ since, until }),
    level: 'account',       // én aggregeret række pr. konto
    access_token: metaToken(),
  })

  // cursor-pagination (aggregeret level giver typisk kun 1 side, men vi er sikre)
  let nextUrl: string | null = `${META_BASE}/${accountId}/insights?${params}`
  const rows: Record<string, unknown>[] = []

  while (nextUrl) {
    const currentUrl: string = nextUrl
    nextUrl = null
    const r: Response = await fetch(currentUrl)
    if (!r.ok) throw new Error(`Meta awareness fetch failed: ${r.status}`)
    const j: { data?: Record<string, unknown>[]; paging?: { next?: string } } = await r.json()
    rows.push(...(j.data ?? []))
    nextUrl = j.paging?.next ?? null
  }

  const spend       = rows.reduce((s, r) => s + (parseFloat(r.spend as string) || 0), 0)
  const impressions = rows.reduce((s, r) => s + (parseInt(r.impressions as string) || 0), 0)
  const reach       = rows.reduce((s, r) => s + (parseInt(r.reach as string) || 0), 0)
  const linkClicks  = rows.reduce((s, r) => s + extractVideoAction(r.actions as Array<{ action_type: string; value: string }>, 'link_click'), 0)
  const v25         = rows.reduce((s, r) => s + extractVideoAction(r.video_p25_watched_actions  as Array<{ action_type: string; value: string }>, 'video_view'), 0)
  const v50         = rows.reduce((s, r) => s + extractVideoAction(r.video_p50_watched_actions  as Array<{ action_type: string; value: string }>, 'video_view'), 0)
  const v75         = rows.reduce((s, r) => s + extractVideoAction(r.video_p75_watched_actions  as Array<{ action_type: string; value: string }>, 'video_view'), 0)
  const v100        = rows.reduce((s, r) => s + extractVideoAction(r.video_p100_watched_actions as Array<{ action_type: string; value: string }>, 'video_view'), 0)

  return {
    spend,
    impressions,
    coviewedImpressions: 0,
    reach,
    frequency:      reach > 0 ? impressions / reach : 0,
    linkClicks,
    videoViews25:   v25,
    videoViews50:   v50,
    videoViews75:   v75,
    videoViews100:  v100,
    completionRate: impressions > 0 ? v100 / impressions : 0,
    cpm:            impressions > 0 ? (spend / impressions) * 1000 : 0,
  }
}

// ── Google Ads ────────────────────────────────────────────────────────────────

const GOOGLE_BASE = 'https://googleads.googleapis.com/v20'

async function googleAccessToken(): Promise<string> {
  const clientId     = process.env.GOOGLE_ADS_CLIENT_ID
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken)
    throw new Error('Google Ads OAuth credentials not set')

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret,
      refresh_token: refreshToken, grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Google OAuth failed: ${res.status}`)
  const j = await res.json()
  return j.access_token as string
}

async function googleHeaders(): Promise<Record<string, string>> {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not set')
  return {
    Authorization:     `Bearer ${await googleAccessToken()}`,
    'developer-token': devToken,
    'Content-Type':    'application/json',
  }
}

export async function fetchGoogleAwareness(
  accountId: string,
  since: string,
  until: string
): Promise<AwarenessData> {
  const query = `
    SELECT
      metrics.cost_micros,
      metrics.impressions,
      metrics.coviewed_impressions,
      metrics.clicks,
      metrics.video_views,
      metrics.video_quartile_p25_rate,
      metrics.video_quartile_p50_rate,
      metrics.video_quartile_p75_rate,
      metrics.video_quartile_p100_rate
    FROM campaign
    WHERE segments.date BETWEEN '${since}' AND '${until}'
      AND campaign.status != 'REMOVED'
  `

  const res = await fetch(`${GOOGLE_BASE}/customers/${accountId}/googleAds:search`, {
    method: 'POST',
    headers: await googleHeaders(),
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Ads awareness fetch failed: ${res.status} ${err}`)
  }

  const json = await res.json()
  const rows: Array<{
    metrics: {
      costMicros?: string
      impressions?: string
      coviewedImpressions?: string
      clicks?: string
      videoViews?: string
      videoQuartileP25Rate?: number
      videoQuartileP50Rate?: number
      videoQuartileP75Rate?: number
      videoQuartileP100Rate?: number
    }
  }> = json.results ?? []

  let spend = 0, impressions = 0, coviewedImpressions = 0, clicks = 0
  let v25 = 0, v50 = 0, v75 = 0, v100 = 0

  for (const row of rows) {
    const m = row.metrics
    const imp = parseInt(m.impressions ?? '0') || 0
    spend               += (parseInt(m.costMicros ?? '0') || 0) / 1_000_000
    impressions         += imp
    coviewedImpressions += parseInt(m.coviewedImpressions ?? '0') || 0
    clicks              += parseInt(m.clicks ?? '0') || 0
    // quartile rates are fractions (0–1) × impressions = views at that threshold
    v25  += Math.round((m.videoQuartileP25Rate  ?? 0) * imp)
    v50  += Math.round((m.videoQuartileP50Rate  ?? 0) * imp)
    v75  += Math.round((m.videoQuartileP75Rate  ?? 0) * imp)
    v100 += Math.round((m.videoQuartileP100Rate ?? 0) * imp)
  }

  return {
    spend,
    impressions,
    coviewedImpressions,
    reach:          0,   // ikke tilgængeligt pr. kampagne i standard Google Ads
    frequency:      0,
    linkClicks:     clicks,
    videoViews25:   v25,
    videoViews50:   v50,
    videoViews75:   v75,
    videoViews100:  v100,
    completionRate: impressions > 0 ? v100 / impressions : 0,
    cpm:            impressions > 0 ? (spend / impressions) * 1000 : 0,
  }
}

// ── LinkedIn ──────────────────────────────────────────────────────────────────

function urnParam(id: string) {
  return `urn%3Ali%3AsponsoredAccount%3A${id}`
}

export async function fetchLinkedInAwareness(
  accountId: string,
  since: string,
  until: string
): Promise<AwarenessData> {
  const [sy, sm, sd] = since.split('-').map(Number)
  const [ey, em, ed] = until.split('-').map(Number)
  const dateRange = `dateRange=(start:(day:${sd},month:${sm},year:${sy}),end:(day:${ed},month:${em},year:${ey}))`
  const accountParam = `accounts=List(${urnParam(accountId)})`
  const fields = 'costInLocalCurrency,impressions,reaches,videoViews,videoCompletions,pivotValues'

  const PAGE = 100
  let start = 0
  let spend = 0, impressions = 0, reach = 0
  let videoViews100 = 0

  while (true) {
    const url = `${LI_BASE}/adAnalytics?q=analytics&pivot=ACCOUNT&timeGranularity=ALL&${dateRange}&${accountParam}&fields=${fields}&count=${PAGE}&start=${start}`
    const r = await fetch(url, { headers: liHeaders() })
    if (!r.ok) throw new Error(`LinkedIn awareness fetch failed: ${r.status}`)
    const j = await r.json()
    const els: Array<{
      costInLocalCurrency?: string
      impressions?: number
      reaches?: number
      videoViews?: number
      videoCompletions?: number
    }> = j.elements ?? []

    for (const el of els) {
      spend       += parseFloat(el.costInLocalCurrency ?? '0')
      impressions += el.impressions       ?? 0
      reach       += el.reaches           ?? 0
      videoViews100 += el.videoCompletions ?? 0
    }

    if (els.length < PAGE) break
    start += PAGE
  }

  return {
    spend,
    impressions,
    coviewedImpressions: 0,
    reach,
    frequency:      reach > 0 ? impressions / reach : 0,
    linkClicks:     0,   // ikke tilgængeligt fra LinkedIn awareness API
    videoViews25:   0,
    videoViews50:   0,
    videoViews75:   0,
    videoViews100,
    completionRate: impressions > 0 ? videoViews100 / impressions : 0,
    cpm:            impressions > 0 ? (spend / impressions) * 1000 : 0,
  }
}
