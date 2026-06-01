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

const BAR_MAX_PX = 180

export function VideoFunnel({ data, loading, color = '#D80070' }: Props) {
  const imp = data.impressions

  const stages = [
    ...(data.videoViews25 != null ? [{ label: '25% set',  value: data.videoViews25 }] : []),
    ...(data.videoViews50 != null ? [{ label: '50% set',  value: data.videoViews50 }] : []),
    ...(data.videoViews75 != null ? [{ label: '75% set',  value: data.videoViews75 }] : []),
    { label: '100% set', value: data.videoViews100 },
  ]

  const max = Math.max(...stages.map(s => s.value), 1)

  return (
    <div className="rounded-xl border bg-white shadow-sm p-6">
      {/* Chart area */}
      <div className="flex items-end justify-center gap-14" style={{ height: BAR_MAX_PX + 40 }}>
        {stages.map(({ label, value }) => {
          const ratio = value / max
          const barH  = Math.max(Math.round(ratio * BAR_MAX_PX), 6)

          return (
            <div key={label} className="flex flex-col items-center gap-1.5" style={{ width: 44 }}>
              {/* Value above bar */}
              <span className="text-xs font-semibold tabular-nums text-foreground text-center leading-tight">
                {loading ? '' : formatNumber(value)}
              </span>

              {/* Bar */}
              <div
                className="w-full rounded-t-lg"
                style={{
                  height:          loading ? BAR_MAX_PX * 0.5 : barH,
                  backgroundColor: color,
                  opacity:         loading ? 0.12 : 0.25 + ratio * 0.75,
                  transition:      'height 0.6s ease, opacity 0.6s ease',
                  minHeight:       6,
                }}
              />
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-center gap-14 mt-2">
        {stages.map(({ label, value }) => {
          const pctOfImp = imp > 0 ? value / imp : null
          return (
            <div key={label} className="flex flex-col items-center gap-0.5" style={{ width: 44 }}>
              <span className="text-xs text-muted-foreground text-center leading-tight">{label}</span>
              {pctOfImp !== null && !loading && (
                <span className="text-xs font-semibold" style={{ color }}>
                  {formatPercent(pctOfImp)}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Fuldførelsesrate</span>
        {loading
          ? <Skeleton className="h-5 w-16" />
          : <span className="text-lg font-bold" style={{ color }}>{formatPercent(data.completionRate)}</span>
        }
      </div>
    </div>
  )
}
