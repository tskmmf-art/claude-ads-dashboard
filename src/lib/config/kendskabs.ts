// ─────────────────────────────────────────────────────────────────────────────
// Kendskabskampagnen — budgetkonfiguration
// Juster månedlige budgetter og foreningsårets datoer her
// ─────────────────────────────────────────────────────────────────────────────

export const FORENINGSAAR = {
  start: new Date('2025-07-01'),
  end:   new Date('2026-06-30'),
}

export const SAMLET_BUDGET = 150_000 // kr.

export interface KanalConfig {
  id:             string
  name:           string
  monthlyBudget:  number          // kr. pr. måned
  platform:       'meta' | 'linkedin' | null  // null = manuel/ingen API
}

export const KANALER: KanalConfig[] = [
  { id: 'meta',    name: 'Meta Ads',      monthlyBudget: 4_000, platform: 'meta'     },
  { id: 'linkedin',name: 'LinkedIn Ads',  monthlyBudget: 2_000, platform: 'linkedin' },
  { id: 'youtube', name: 'YouTube Ads',   monthlyBudget: 3_500, platform: null       },
  { id: 'tv2play', name: 'TV2 Play Ads',  monthlyBudget: 3_000, platform: null       },
]

// Hjælpefunktioner ─────────────────────────────────────────────────────────

/** Antal fulde måneder fra i dag til foreningsårets slut */
export function remainingMonths(): number {
  const now   = new Date()
  const end   = FORENINGSAAR.end
  const diff  = (end.getFullYear() - now.getFullYear()) * 12 +
                (end.getMonth()   - now.getMonth())
  return Math.max(diff, 0)
}

/** Resterende budget for en kanal (månedligt budget × resterende måneder) */
export function remainingBudget(kanal: KanalConfig): number {
  return kanal.monthlyBudget * remainingMonths()
}

/** Total resterende budget på tværs af alle kanaler */
export function totalRemainingBudget(): number {
  return KANALER.reduce((sum, k) => sum + remainingBudget(k), 0)
}
