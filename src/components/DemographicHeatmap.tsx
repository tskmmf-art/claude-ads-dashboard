import { Skeleton } from '@/components/ui/skeleton'
import type { DemoCell } from '@/lib/api/awareness'

const DEFAULT_AGE_GROUPS = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+']
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
  cells:      DemoCell[]
  loading?:   boolean
  color?:     string
  metric?:    'impressions' | 'completions'
  title?:     string
  ageGroups?: string[]
}

export function DemographicHeatmap({ cells, loading, color = '#4472CA', metric = 'impressions', title, ageGroups = DEFAULT_AGE_GROUPS }: Props) {
  const [r, g, b] = hexToRgb(color)
  const cols = ageGroups.length

  const lookup: Record<string, number> = {}
  for (const c of cells) lookup[`${c.gender}|${c.age}`] = c[metric]
  const max = Math.max(...Object.values(lookup), 1)

  function bg(gender: 'male' | 'female', age: string) {
    const val   = lookup[`${gender}|${age}`] ?? 0
    const alpha = val > 0 ? 0.1 + (val / max) * 0.9 : 0.04
    return { backgroundColor: `rgba(${r},${g},${b},${alpha})` }
  }

  const gridCols = `80px repeat(${cols}, 1fr)`

  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <div className="p-5">
        {title && (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            {title}
          </p>
        )}

        {/* Column headers */}
        <div className="grid mb-2" style={{ gridTemplateColumns: gridCols }}>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">Køn</div>
          {ageGroups.map(age => (
            <div key={age} className="text-xs font-semibold text-muted-foreground text-center">{age}</div>
          ))}
        </div>

        {/* Rows */}
        {GENDERS.map(({ key, label }) => (
          <div key={key} className="grid gap-2 mb-2" style={{ gridTemplateColumns: gridCols }}>
            <div className="text-sm font-medium text-foreground flex items-center">{label}</div>
            {ageGroups.map(age => (
              <div
                key={age}
                className="rounded-lg h-16 transition-colors"
                style={bg(key, age)}
              >
                {loading && <Skeleton className="w-full h-full rounded-lg" />}
              </div>
            ))}
          </div>
        ))}

        {!loading && cells.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Ingen data tilgængelig for perioden
          </p>
        )}
      </div>
    </div>
  )
}
