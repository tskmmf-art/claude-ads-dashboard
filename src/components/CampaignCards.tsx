export interface Campaign {
  /** Kampagnenavn, fx "Skippable In-Stream" */
  name:        string
  /** Kort forklaring af formatet */
  description: string
  /** Varighed, fx "Op til 30 sek" — vises med ur-ikon */
  duration:    string
  /** Skipbarhed, fx "Kan skippes efter 5 sek" */
  skippable:   string
}

function Tag({ children, icon }: { children: React.ReactNode; icon?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
      {icon && (
        <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
          <path strokeLinecap="round" strokeWidth={2} d="M12 7v5l3 2" />
        </svg>
      )}
      {children}
    </span>
  )
}

export function CampaignCards({ campaigns, color }: { campaigns: Campaign[]; color: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((c) => (
        <div
          key={c.name}
          className="rounded-xl border border-border bg-white p-5 shadow-sm"
          style={{ borderLeft: `4px solid ${color}` }}
        >
          <h3 className="text-base font-bold text-foreground">{c.name}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag icon>{c.duration}</Tag>
            <Tag>{c.skippable}</Tag>
          </div>
        </div>
      ))}
    </div>
  )
}
