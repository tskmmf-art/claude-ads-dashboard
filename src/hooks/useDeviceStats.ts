'use client'

import useSWR from 'swr'
import type { DeviceStat } from '@/lib/api/awareness'
import type { DateRange } from '@/types'
import { formatDate } from '@/lib/utils/formatters'

const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

export function useDeviceStats(
  platform: 'meta' | 'google',
  accountId: string | null,
  dateRange: DateRange,
  enabled: boolean
) {
  const since = formatDate(dateRange.from)
  const until = formatDate(dateRange.to)

  const key = enabled && accountId
    ? `/api/device-stats?platform=${platform}&accountId=${accountId}&since=${since}&until=${until}`
    : null

  const { data, error, isLoading } = useSWR<{ data: DeviceStat[] }>(key, fetcher, {
    revalidateOnFocus: false,
  })

  return {
    data:      data?.data ?? [],
    error:     error as Error | undefined,
    isLoading,
  }
}
