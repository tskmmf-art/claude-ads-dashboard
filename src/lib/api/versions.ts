// ─────────────────────────────────────────────────────────────────────────────
// Ét sted for alle eksterne API-versioner.
//
// Versionerne lå tidligere hardkodet i fire filer hver for sig, og to gange
// ramte en "opdater alle versioner" kun nogle af dem — senest stod
// linkedin.ts tilbage på 202503 længe efter resten var opdateret.
// Tilføj aldrig en version direkte i en api-fil; importér herfra.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Meta Graph API.
 * v19.0 udløb 21. maj 2026. v25.0 er nuværende.
 * Se https://developers.facebook.com/docs/graph-api/changelog
 */
export const META_API_VERSION = 'v25.0'
export const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`

/**
 * Google Ads API.
 * v20 lukkede 10. juni 2026. Google gik til månedlige udgivelser i januar 2026,
 * og hver major understøttes ca. et år: v23 lukker februar 2027, v24 maj 2027.
 * Se https://developers.google.com/google-ads/api/docs/sunset-dates
 */
export const GOOGLE_ADS_API_VERSION = 'v24'
export const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

/**
 * LinkedIn Marketing API — versionen er YYYYMM og skal sendes som header på
 * hvert kald; LinkedIn falder ikke tilbage til nyeste, men fejler.
 * Hver version understøttes minimum et år, så denne skal fornys løbende.
 * Se https://learn.microsoft.com/en-us/linkedin/marketing/versioning
 */
export const LINKEDIN_API_VERSION = '202607'
export const LINKEDIN_BASE = 'https://api.linkedin.com/rest'
