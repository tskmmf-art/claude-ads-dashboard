// ─────────────────────────────────────────────────────────────────────────────
// Ét sted for alle eksterne API-versioner.
//
// Versionerne lå tidligere hardkodet i fire filer hver for sig, og to gange
// ramte en "opdater alle versioner" kun nogle af dem — senest stod
// linkedin.ts tilbage på 202503 længe efter resten var opdateret.
// Tilføj aldrig en version direkte i en api-fil; importér herfra.
//
// Alle tre kan overstyres med en miljøvariabel i Vercel, så en version kan
// rulles frem eller tilbage uden en kodeændring. Standardværdierne herunder
// er dem vi ved virker — hæv dem kun når den nye version er afprøvet.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Meta Graph API. v19.0 udløb 21. maj 2026.
 * Overstyr med META_API_VERSION.
 */
export const META_API_VERSION = process.env.META_API_VERSION || 'v25.0'
export const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`

/**
 * Google Ads API. v20 lukkede 10. juni 2026.
 * v23 er afprøvet og virker; den lever til februar 2027. v24 findes, men er
 * ikke testet mod denne konto — hæv først når det er bekræftet.
 * Overstyr med GOOGLE_ADS_API_VERSION.
 */
export const GOOGLE_ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v23'
export const GOOGLE_ADS_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

/**
 * LinkedIn Marketing API — versionen er YYYYMM og skal sendes som header på
 * hvert kald; LinkedIn falder ikke tilbage til nyeste, men fejler.
 * Hver version understøttes minimum et år, så denne skal fornys løbende.
 * Overstyr med LINKEDIN_API_VERSION.
 */
export const LINKEDIN_API_VERSION = process.env.LINKEDIN_API_VERSION || '202606'
export const LINKEDIN_BASE = 'https://api.linkedin.com/rest'
