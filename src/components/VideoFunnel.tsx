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
    { label: 'Eksponeringer', value: imp,               pct: 1 },
    ...(data.videoViews25 != null ? [{ label: '25% set',    value: data.videoViews25, pct: imp > 0 ? data.videoViews25 / imp : 0 }] : []),
    ...(data.videoViews50 != null ? [{ label: '50% set',    value: data.videoViews50, pct: imp > 0 ? data.videoViews50 / imp : 0 }] : []),
    ...(data.videoViews75 != null ? [{ label: '75% set',    value: data.videoViews75, pct: imp > 0 ? data.videoViews75 / imp : 0 }] : []),
    { label: 'Gennemført (100%)', value: data.videoViews100, pct: imp > 0 ? data.videoViews100 / imp : 0 },
  ]

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5">
      <div className="space-y-3">
        {stages.map(({ label, value, pct }) => (
          <div key={label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">{label}</span>
              <div className="flex items-center gap-3 tabular-nums text-sm text-muted-foreground">
                {loading ? <Skeleton className="h-4 w-20" /> : (
                  <>
                    <span>{formatNumber(value)}</span>
                    <span className="font-semibold w-14 text-right" style={{ color }}>
                      {pct < 1 ? formatPercent(pct) : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              {!loading && (
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct * 100}%`, backgroundColor: color, opacity: 0.2 + pct * 0.8 }}
                />
              )}
              {loading && <Skeleton className="h-full w-3/4 rounded-full" />}
            </div>
          </div>
        ))}
      </div>

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
