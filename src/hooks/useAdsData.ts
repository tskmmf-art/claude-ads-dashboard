'use client'

import useSWR from 'swr'
import type { AdAccount, AdMetrics, DateRange, Platform } from '@/types'
import { formatDate } from '@/lib/utils/formatters'

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  })

export function useAccounts(platform: Platform, enabled: boolean) {
  const { data, error, isLoading } = useSWR<{ data: AdAccount[] }>(
    enabled ? `/api/${platform}?type=accounts` : null,
    fetcher,
    { revalidateOnFocus: false }
  )
  return {
    accounts: data?.data ?? [],
    error: error as Error | undefined,
    isLoading,
  }
}

export function usePlatformInsights(
  platform: Platform,
  accountId: string | null,
  dateRange: DateRange,
  enabled: boolean
) {
  const since = formatDate(dateRange.from)
  const until = formatDate(dateRange.to)

  const key =
    enabled && accountId
      ? `/api/${platform}?type=insights&accountId=${accountId}&since=${since}&until=${until}`
      : null

  const { data, error, isLoading } = useSWR<{ data: AdMetrics[] }>(key, fetcher, {
    revalidateOnFocus: false,
  })

  return {
    data: data?.data ?? [],
    error: error as Error | undefined,
    isLoading,
  }
}
