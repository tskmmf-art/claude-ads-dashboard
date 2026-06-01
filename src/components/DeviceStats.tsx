import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/utils/formatters'
import type { DeviceStat } from '@/lib/api/awareness'

const ICONS: Record<string, React.ReactNode> = {
  Mobile: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  Desktop: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Tablet: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  TV: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
}

interface Props {
  stats:    DeviceStat[]
  loading?: boolean
  color?:   string
}

export function DeviceStats({ stats, loading, color = '#D80070' }: Props) {
  const total = stats.reduce((s, d) => s + d.impressions, 0)

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : stats.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Ingen enheds­data tilgængelig</p>
      ) : (
        <div className="space-y-3">
          {stats.map(({ device, impressions }) => {
            const pct = total > 0 ? impressions / total : 0
            return (
              <div key={device}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground" style={{ color: 'inherit' }}>
                    <span style={{ color }}>{ICONS[device] ?? ICONS.Desktop}</span>
                    {device}
                  </div>
                  <div className="flex items-center gap-3 text-sm tabular-nums text-muted-foreground">
                    <span>{formatNumber(impressions)}</span>
                    <span className="font-semibold w-12 text-right" style={{ color }}>
                      {(pct * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct * 100}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
