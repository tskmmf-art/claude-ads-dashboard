import { NextRequest, NextResponse } from 'next/server'
import { fetchMetaAwareness, fetchLinkedInAwareness, fetchGoogleAwareness } from '@/lib/api/awareness'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const platform  = searchParams.get('platform')
  const accountId = searchParams.get('accountId')
  const since     = searchParams.get('since')
  const until     = searchParams.get('until')

  if (!accountId || !since || !until) {
    return NextResponse.json({ error: 'Missing accountId, since or until' }, { status: 400 })
  }

  try {
    if (platform === 'meta') {
      const data = await fetchMetaAwareness(accountId, since, until)
      return NextResponse.json({ data })
    }
    if (platform === 'linkedin') {
      const data = await fetchLinkedInAwareness(accountId, since, until)
      return NextResponse.json({ data })
    }
    if (platform === 'google') {
      const data = await fetchGoogleAwareness(accountId, since, until)
      return NextResponse.json({ data })
    }
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
