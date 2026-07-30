import { Skeleton } from '@/components/ui/skeleton'
import type { DeviceStat } from '@/lib/api/awareness'

// Distinct colors per slice position — same palette regardless of brand color
const SLICE_COLORS = ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F']

const CX = 75, CY = 75, R = 52, SW = 24
const C  = 2 * Math.PI * R

interface Props {
  stats:    DeviceStat[]
  loading?: boolean
  color?:   string
  /** Overskrift i kortet, fx "Eksponeringer pr. enhed" */
  title?:   string
  /** Hvilken værdi kagen fordeler — eksponeringer (default) eller thruplays */
  metric?:  'impressions' | 'completions'
}

export function DevicePieChart({ stats, loading, title, metric = 'impressions' }: Props) {
  const valueOf = (s: DeviceStat) =>
    metric === 'completions' ? (s.completions ?? 0) : s.impressions

  const total = stats.reduce((sum, s) => sum + valueOf(s), 0)

  const segs = stats
    .map((stat, i) => ({
      device: stat.device,
      value:  valueOf(stat),
      pct:    total > 0 ? valueOf(stat) / total : 0,
      fill:   SLICE_COLORS[i % SLICE_COLORS.length],
    }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)

  let cumDeg = -90

  return (
    <div className="rounded-xl border bg-white shadow-sm p-5 flex flex-col h-full">
      {title && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
      )}

      <div className="flex flex-1 flex-col items-center justify-center">
        {loading ? (
          <Skeleton className="w-36 h-36 rounded-full" />
        ) : segs.length === 0 ? (
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
    </div>
  )
}
