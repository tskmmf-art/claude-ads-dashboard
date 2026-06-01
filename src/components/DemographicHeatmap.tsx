import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/utils/formatters'
import type { DemoCell } from '@/lib/api/awareness'

const AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
const GENDERS: { key: 'male' | 'female'; label: string }[] = [
  { key: 'male',   label: 'Mand'   },
  { key: 'female', label: 'Kvinde' },
]

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

interface Props {
  cells:    DemoCell[]
  loading?: boolean
  color?:   string
}

export function DemographicHeatmap({ cells, loading, color = '#4472CA' }: Props) {
  const [r, g, b] = hexToRgb(color)

  const lookup: Record<string, number> = {}
  for (const c of cells) lookup[`${c.gender}|${c.age}`] = c.impressions
  const max = Math.max(...cells.map(c => c.impressions), 1)

  function bg(gender: 'male' | 'female', age: string) {
    const imps = lookup[`${gender}|${age}`] ?? 0
    const alpha = imps > 0 ? 0.12 + (imps / max) * 0.88 : 0.05
    return { backgroundColor: `rgba(${r},${g},${b},${alpha})` }
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <div className="p-5">
        {/* Column headers */}
        <div className="grid mb-2" style={{ gridTemplateColumns: '80px repeat(6, 1fr)' }}>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">
            Køn
          </div>
          {AGE_GROUPS.map(age => (
            <div key={age} className="text-xs font-semibold text-muted-foreground text-center">
              {age}
            </div>
          ))}
        </div>

        {/* Rows */}
        {GENDERS.map(({ key, label }) => (
          <div key={key} className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '80px repeat(6, 1fr)' }}>
            <div className="text-sm font-medium text-foreground flex items-center">
              {label}
            </div>
            {AGE_GROUPS.map(age => {
              const imps = lookup[`${key}|${age}`] ?? 0
              return (
                <div
                  key={age}
                  className="rounded-lg flex flex-col items-center justify-center py-3 transition-opacity"
                  style={bg(key, age)}
                  title={`${label} ${age}: ${formatNumber(imps)} eksponeringer`}
                >
                  {loading ? (
                    <Skeleton className="h-4 w-12" />
                  ) : (
                    <span className="text-xs font-semibold tabular-nums text-foreground/80">
                      {imps > 0 ? formatNumber(imps) : '—'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {!loading && cells.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Ingen demografidata tilgængelig for perioden
          </p>
        )}
      </div>
    </div>
  )
}
