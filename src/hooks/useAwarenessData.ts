'use client'

import useSWR from 'swr'
import type { AwarenessData } from '@/lib/api/awareness'
import type { DateRange } from '@/types'
import { formatDate } from '@/lib/utils/formatters'

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

export function useAwareness(
  platform: 'meta' | 'linkedin',
  accountId: string | null,
  dateRange: DateRange,
  enabled: boolean
) {
  const since = formatDate(dateRange.from)
  const until = formatDate(dateRange.to)

  const key = enabled && accountId
    ? `/api/awareness?platform=${platform}&accountId=${accountId}&since=${since}&until=${until}`
    : null

  const { data, error, isLoading } = useSWR<{ data: AwarenessData }>(key, fetcher, {
    revalidateOnFocus: false,
  })

  const empty: AwarenessData = {
    spend: 0, impressions: 0, reach: 0, frequency: 0,
    linkClicks: 0,
    videoViews25: 0, videoViews50: 0, videoViews75: 0, videoViews100: 0,
    completionRate: 0, cpm: 0,
  }

  return {
    data:      data?.data ?? empty,
    error:     error as Error | undefined,
    isLoading,
  }
}
