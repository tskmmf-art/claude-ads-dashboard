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
  spend:          number
  impressions:    number
  reach:          number
  frequency:      number   // impressions / reach
  videoViews25:   number
  videoViews50:   number
  videoViews75:   number
  videoViews100:  number
  completionRate: number   // videoViews100 / impressions
  cpm:            number   // spend / impressions * 1000
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
  const v25         = rows.reduce((s, r) => s + extractVideoAction(r.video_p25_watched_actions as Array<{ action_type: string; value: string }>, 'video_view'), 0)
  const v50         = rows.reduce((s, r) => s + extractVideoAction(r.video_p50_watched_actions as Array<{ action_type: string; value: string }>, 'video_view'), 0)
  const v75         = rows.reduce((s, r) => s + extractVideoAction(r.video_p75_watched_actions as Array<{ action_type: string; value: string }>, 'video_view'), 0)
  const v100        = rows.reduce((s, r) => s + extractVideoAction(r.video_p100_watched_actions as Array<{ action_type: string; value: string }>, 'video_view'), 0)

  return {
    spend,
    impressions,
    reach,
    frequency:      reach > 0 ? impressions / reach : 0,
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
    reach,
    frequency:      reach > 0 ? impressions / reach : 0,
    videoViews25:   0,   // ikke tilgængeligt fra LinkedIn
    videoViews50:   0,
    videoViews75:   0,
    videoViews100,
    completionRate: impressions > 0 ? videoViews100 / impressions : 0,
    cpm:            impressions > 0 ? (spend / impressions) * 1000 : 0,
  }
}
