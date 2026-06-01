import { formatCurrency } from '@/lib/utils/formatters'

const WEEKS = [19, 20, 21, 22, 23, 24, 25, 26]

export interface GanttPhase {
  name: string
  startWeek: number
  endWeek: number
  budget: number
  color: string
}

export function CampaignGantt({ phases }: { phases: GanttPhase[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground w-40">
              Fase
            </th>
            {WEEKS.map(w => (
              <th key={w} className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                W{w}
              </th>
            ))}
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">
              Budget
            </th>
          </tr>
        </thead>
        <tbody>
          {phases.map((phase, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                {phase.name}
              </td>
              {WEEKS.map(w => (
                <td key={w} className="px-0.5 py-2">
                  {w >= phase.startWeek && w <= phase.endWeek && (
                    <div
                      className="rounded mx-0.5"
                      style={{ height: 28, backgroundColor: phase.color }}
                    />
                  )}
                </td>
              ))}
              <td className="px-4 py-3 text-sm text-right tabular-nums text-muted-foreground whitespace-nowrap">
                {formatCurrency(phase.budget)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
