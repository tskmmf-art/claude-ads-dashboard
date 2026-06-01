import { NextRequest, NextResponse } from 'next/server'
import { fetchMetaDemographics, fetchGoogleDemographics } from '@/lib/api/awareness'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform  = searchParams.get('platform')
  const accountId = searchParams.get('accountId')
  const since     = searchParams.get('since')
  const until     = searchParams.get('until')
  const debug     = searchParams.get('debug') === '1'

  if (!accountId || !since || !until)
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

  try {
    if (platform === 'meta') {
      const data = await fetchMetaDemographics(accountId, since, until)
      return NextResponse.json({ data, ...(debug && { count: data.length }) })
    }
    if (platform === 'google') {
      const data = await fetchGoogleDemographics(accountId, since, until)
      return NextResponse.json({ data, ...(debug && { count: data.length }) })
    }
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[demographics] ${platform} error:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
