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
    <aside className="flex h-screen w-56 flex-col bg-mmf-dark">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="h-2 w-2 rounded-none bg-mmf-red shrink-0" />
          <p className="text-sm font-bold tracking-tight text-white">MMF Dashboard</p>
        </div>
        <p className="text-xs text-white/40 pl-4">Meta · Google · LinkedIn</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 p-3 pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-sm',
                active
                  ? 'bg-mmf-red text-white'
                  : 'text-white/50 hover:bg-white/8 hover:text-white/90'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="leading-tight">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-xs text-white/25">Maskinmestrenes Forening</p>
      </div>
    </aside>
  )
}
