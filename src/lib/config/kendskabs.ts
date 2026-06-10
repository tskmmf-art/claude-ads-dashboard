// ─────────────────────────────────────────────────────────────────────────────
// Kendskabskampagnen — budgetkonfiguration
// Juster budgetter og kampagneperiode her
// ─────────────────────────────────────────────────────────────────────────────

export const KAMPAGNE_PERIODE = {
  start: new Date('2026-05-01'),
  end:   new Date('2026-06-30'),
}

export const SAMLET_BUDGET = 150_000 // kr.

export interface KanalConfig {
  id:          string
  name:        string
  budget:      number                        // kr. for hele kampagneperioden
  platform:    'meta' | 'google' | null      // null = manuel/ingen API
  manualReach?: number                       // manuelt indtastet reach (unikke brugere)
}

export const KANALER: KanalConfig[] = [
  { id: 'meta',    name: 'Meta Ads',     budget: 40_000, platform: 'meta'   },
  { id: 'youtube', name: 'YouTube Ads',  budget: 50_000, platform: 'google', manualReach: 0 },
  // ↑ Opdater manualReach med "Unikke brugere" fra Google Ads UI
  { id: 'tv2play', name: 'TV2 Play Ads', budget: 60_000, platform: null     },
]

export const TV2_DEVICE_STATS = [
  { device: 'TV',      impressions: 145_418 },
  { device: 'Desktop', impressions:   6_369 },
  { device: 'Tablet',  impressions:   7_117 },
  { device: 'Mobile',  impressions:   3_625 },
]

// Hjælpefunktioner ─────────────────────────────────────────────────────────

/** Antal resterende måneder i kampagneperioden fra i dag */
export function remainingMonths(): number {
  const now = new Date()
  const end = KAMPAGNE_PERIODE.end
  if (now > end) return 0
  const diff =
    (end.getFullYear() - now.getFullYear()) * 12 +
    (end.getMonth() - now.getMonth())
  return Math.max(diff, 0)
}

/** Resterende budget for en kanal (budget − brugt) */
export function remainingBudget(kanal: KanalConfig, spent: number): number {
  return Math.max(kanal.budget - spent, 0)
}

/** Total resterende budget på tværs af alle kanaler */
export function totalRemainingBudget(totalSpent: number): number {
  return Math.max(SAMLET_BUDGET - totalSpent, 0)
}
