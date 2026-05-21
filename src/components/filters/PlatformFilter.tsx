'use client'

import type { Platform, PlatformState } from '@/types'
import { Button } from '@/components/ui/button'

const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: 'meta', label: 'Meta', color: '#1877F2' },
  { id: 'google', label: 'Google', color: '#34A853' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
]

interface Props {
  platforms: Record<Platform, PlatformState>
  onChange: (platform: Platform, enabled: boolean) => void
}

export function PlatformFilter({ platforms, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      {PLATFORMS.map(({ id, label, color }) => {
        const enabled = platforms[id].enabled
        return (
          <Button
            key={id}
            size="sm"
            variant={enabled ? 'default' : 'outline'}
            style={enabled ? { backgroundColor: color, borderColor: color } : undefined}
            onClick={() => onChange(id, !enabled)}
          >
            {label}
          </Button>
        )
      })}
    </div>
  )
}
