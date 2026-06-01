import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber, formatPercent } from '@/lib/utils/formatters'

export interface VideoFunnelData {
  impressions:    number
  videoViews25?:  number
  videoViews50?:  number
  videoViews75?:  number
  videoViews100:  number
  completionRate: number
}

interface Props {
  data:     VideoFunnelData
  loading?: boolean
  color?:   string
}

export function VideoFunnel({ data, loading, color = '#D80070' }: Props) {
  const imp = data.impressions

  const stages = [
    { label: 'Eksponeringer', value: imp },
    ...(data.videoViews25 != null ? [{ label: '25% set',  value: data.videoViews25 }] : []),
    ...(data.videoViews50 != null ? [{ label: '50% set',  value: data.videoViews50 }] : []),
    ...(data.videoViews75 != null ? [{ label: '75% set',  value: data.videoViews75 }] : []),
    { label: '100% set', value: data.videoViews100 },
  ]

  const max = Math.max(...stages.map(s => s.value), 1)

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5">
      <div className="flex items-end justify-around gap-2 h-52">
        {stages.map(({ label, value }) => {
          const pct = value / max
          return (
            <div key={label} className="flex flex-col items-center gap-1 flex-1">
              {/* Value label */}
              <span className="text-xs tabular-nums font-semibold text-foreground text-center">
                {loading ? '' : formatNumber(value)}
              </span>
              {/* Bar */}
              <div className="w-full rounded-t-md transition-all duration-700 relative"
                style={{
                  height: loading ? '60%' : `${Math.max(pct * 100, 4)}%`,
                  backgroundColor: color,
                  opacity: loading ? 0.15 : 0.2 + pct * 0.8,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-around mt-2 gap-2">
        {stages.map(({ label, value }) => {
          const pct = imp > 0 && label !== 'Eksponeringer' ? value / imp : null
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
              {pct !== null && !loading && (
                <span className="text-xs font-semibold" style={{ color }}>
                  {formatPercent(pct)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Fuldførelsesrate</span>
        {loading
          ? <Skeleton className="h-5 w-16" />
          : <span className="text-lg font-bold" style={{ color }}>{formatPercent(data.completionRate)}</span>
        }
      </div>
    </div>
  )
}
