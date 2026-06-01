import { Skeleton } from '@/components/ui/skeleton'
import type { DeviceStat } from '@/lib/api/awareness'

// Distinct colors per slice position — same palette regardless of brand color
const SLICE_COLORS = ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F']

const CX = 95, CY = 95, R = 72, SW = 28
const C  = 2 * Math.PI * R

interface Props {
  stats:    DeviceStat[]
  loading?: boolean
  color?:   string
}

export function DevicePieChart({ stats, loading }: Props) {
  const total = stats.reduce((s, d) => s + d.impressions, 0)

  const segs = stats.map((stat, i) => ({
    device:      stat.device,
    impressions: stat.impressions,
    pct:         total > 0 ? stat.impressions / total : 0,
    fill:        SLICE_COLORS[i % SLICE_COLORS.length],
  }))

  let cumDeg = -90

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 flex flex-col items-center justify-center h-full">
      {loading ? (
        <Skeleton className="w-36 h-36 rounded-full" />
      ) : stats.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center">Ingen data</p>
      ) : (
        <>
          <svg width="100%" viewBox={`0 0 ${CX * 2} ${CY * 2}`}>
            {/* Track */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f3f4f6" strokeWidth={SW} />

            {segs.map((seg, i) => {
              const rotation = cumDeg
              const dashLen  = seg.pct * C
              cumDeg += seg.pct * 360
              return (
                <circle
                  key={i}
                  cx={CX} cy={CY} r={R}
                  fill="none"
                  stroke={seg.fill}
                  strokeWidth={SW}
                  strokeDasharray={`${dashLen} ${C - dashLen}`}
                  transform={`rotate(${rotation},${CX},${CY})`}
                />
              )
            })}
          </svg>

          {/* Legend */}
          <div className="mt-3 space-y-1.5 w-full">
            {segs.map((seg) => (
              <div key={seg.device} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.fill }} />
                  <span className="text-xs text-muted-foreground">{seg.device}</span>
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color: seg.fill }}>
                  {(seg.pct * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
