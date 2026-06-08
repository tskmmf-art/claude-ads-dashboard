'use client'

import useSWR from 'swr'
import type { AdAccount, AdMetrics, DateRange, Platform } from '@/types'
import { formatDate } from '@/lib/utils/formatters'

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${r.status}`)
  }
  return r.json()
}

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
