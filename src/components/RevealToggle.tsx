'use client'

/** Vis/skjul-knap til resultatsektioner — indholdet blurres når det er skjult */
export function RevealToggle({ revealed, onToggle }: {
  revealed: boolean
  onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
        revealed
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
      }`}
    >
      {revealed ? (
        <>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
          </svg>
          Skjul resultater
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Vis resultater
        </>
      )}
    </button>
  )
}

/** Wrapper der blurrer sit indhold når resultater er skjult */
export function Revealable({ revealed, children }: {
  revealed: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`transition-all duration-300 ${revealed ? '' : 'pointer-events-none select-none blur-sm'}`}>
      {children}
    </div>
  )
}
