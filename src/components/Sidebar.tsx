'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Overall Performance',
    icon: BarChart2,
  },
  {
    href: '/kendskabskampagnen',
    label: 'Kendskabskampagnen',
    icon: Megaphone,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-white shadow-sm">
      {/* Logo */}
      <div className="border-b px-5 py-5">
        <p className="text-sm font-bold leading-tight tracking-tight">Ads Dashboard</p>
        <p className="text-xs text-muted-foreground">Meta · LinkedIn</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="leading-tight">{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
