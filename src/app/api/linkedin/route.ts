import { NextRequest, NextResponse } from 'next/server'
import { fetchLinkedInAccounts, fetchLinkedInInsights } from '@/lib/api/linkedin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  try {
    if (type === 'accounts') {
      const accounts = await fetchLinkedInAccounts()
      return NextResponse.json({ data: accounts })
    }

    if (type === 'insights') {
      const accountId = searchParams.get('accountId')
      const since = searchParams.get('since')
      const until = searchParams.get('until')

      if (!accountId || !since || !until) {
        return NextResponse.json({ error: 'Missing accountId, since, or until' }, { status: 400 })
      }

      const data = await fetchLinkedInInsights(accountId, since, until)
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
