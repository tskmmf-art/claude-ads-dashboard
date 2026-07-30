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

/**
 * TV2 Play enhedsfordeling — manuelt indtastet fra TV2 Connect.
 * TV2 leverer ingen API, så tallene vedligeholdes her.
 * completions = eksponeringer × fuldførelsesrate (97,63 %), som er ens på tværs
 * af enheder fordi pre-roll ikke kan skippes.
 */
export const TV2_DEVICE_STATS = [
  { device: 'Connected TV', impressions: 126_654, completions: 123_653 },
  { device: 'Desktop',      impressions:   5_635, completions:   5_501 },
  { device: 'Tablet',       impressions:   5_635, completions:   5_501 },
  { device: 'Smartphone',   impressions:   2_818, completions:   2_751 },
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
