import { NextResponse } from 'next/server'
import { fetchMetaAccounts } from '@/lib/api/meta'
import { fetchGoogleAccounts } from '@/lib/api/google'
import { fetchLinkedInAccounts } from '@/lib/api/linkedin'
import {
  META_API_VERSION,
  GOOGLE_ADS_API_VERSION,
  LINKEDIN_API_VERSION,
} from '@/lib/api/versions'

// Diagnose-endpoint: kalder alle tre integrationer og viser den rå fejl.
// Formålet er at kunne se præcis hvad der fejler i stedet for at gætte ud fra
// fejlbeskeder i UI'et. Åbn /api/health i browseren.

export const dynamic = 'force-dynamic'

const ENV_KEYS = [
  'META_ACCESS_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'LINKEDIN_ACCESS_TOKEN',
] as const

async function probe(name: string, fn: () => Promise<{ id: string; name: string }[]>) {
  const started = Date.now()
  try {
    const accounts = await fn()
    return {
      integration: name,
      ok:          true,
      ms:          Date.now() - started,
      accounts:    accounts.length,
      sample:      accounts.slice(0, 3).map(a => `${a.name} (${a.id})`),
    }
  } catch (err) {
    return {
      integration: name,
      ok:          false,
      ms:          Date.now() - started,
      error:       err instanceof Error ? err.message : String(err),
    }
  }
}

export async function GET() {
  // Vis kun om nøglen er sat og hvor lang den er — aldrig selve værdien
  const env = Object.fromEntries(
    ENV_KEYS.map(k => [k, process.env[k] ? `sat (${process.env[k]!.length} tegn)` : 'MANGLER'])
  )

  const checks = await Promise.all([
    probe('meta',     fetchMetaAccounts),
    probe('google',   fetchGoogleAccounts),
    probe('linkedin', fetchLinkedInAccounts),
  ])

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    versions: {
      meta:     META_API_VERSION,
      google:   GOOGLE_ADS_API_VERSION,
      linkedin: LINKEDIN_API_VERSION,
    },
    env,
    checks,
  }, { status: checks.every(c => c.ok) ? 200 : 503 })
}
