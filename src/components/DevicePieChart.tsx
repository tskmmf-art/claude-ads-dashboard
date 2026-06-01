import { Skeleton } from '@/components/ui/skeleton'
import type { DeviceStat } from '@/lib/api/awareness'

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}

const OPACITIES = [1, 0.70, 0.44, 0.24, 0.14]

const CX = 75, CY = 75, R = 52, SW = 24
const C  = 2 * Math.PI * R

interface Props {
  stats:    DeviceStat[]
  loading?: boolean
  color?:   string
}

export function DevicePieChart({ stats, loading, color = '#4472CA' }: Props) {
  const [r, g, b] = hexToRgb(color)
  const total = stats.reduce((s, d) => s + d.impressions, 0)

  const segs = stats.map((stat, i) => ({
    device:      stat.device,
    impressions: stat.impressions,
    pct:         total > 0 ? stat.impressions / total : 0,
    fill:        `rgba(${r},${g},${b},${OPACITIES[i] ?? 0.12})`,
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
          <svg width={CX * 2} height={CY * 2} viewBox={`0 0 ${CX * 2} ${CY * 2}`}>
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
