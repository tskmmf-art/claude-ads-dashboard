import { NextRequest, NextResponse } from 'next/server'
import { fetchMetaDeviceStats, fetchMetaPlatformStats, fetchGoogleDeviceStats } from '@/lib/api/awareness'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform  = searchParams.get('platform')
  const accountId = searchParams.get('accountId')
  const since     = searchParams.get('since')
  const until     = searchParams.get('until')
  const breakdown = searchParams.get('breakdown')   // 'device' (default) | 'platform'

  if (!accountId || !since || !until)
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

  try {
    if (platform === 'meta') {
      const data = breakdown === 'platform'
        ? await fetchMetaPlatformStats(accountId, since, until)
        : await fetchMetaDeviceStats(accountId, since, until)
      return NextResponse.json({ data })
    }
    if (platform === 'google') {
      const data = await fetchGoogleDeviceStats(accountId, since, until)
      return NextResponse.json({ data })
    }
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[device-stats] ${platform} error:`, message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
