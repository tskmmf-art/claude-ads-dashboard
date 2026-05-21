'use client'

import type { AdAccount, Platform } from '@/types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  platform: Platform
  accounts: AdAccount[]
  selectedId: string | null
  isLoading: boolean
  error?: Error
  onChange: (id: string) => void
}

export function AccountSelector({ platform, accounts, selectedId, isLoading, error, onChange }: Props) {
  if (isLoading) return <Skeleton className="h-9 w-44" />
  if (error) return <span className="text-xs text-destructive">Failed to load {platform} accounts</span>
  if (accounts.length === 0) return null

  return (
    <Select value={selectedId ?? ''} onValueChange={onChange}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder={`${platform} account`} />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
