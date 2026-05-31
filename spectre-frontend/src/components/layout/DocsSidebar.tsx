import { NavLink } from 'react-router-dom'
import { Zap, KeyRound } from 'lucide-react'
import { docsNav } from '@/config/docsNav'
import type { NavItem } from '@/config/docsNav'
import MethodBadge from '@/components/docs/MethodBadge'
import { cn } from '@/lib/utils'

const iconMap: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-3.5 h-3.5" />,
  KeyRound: <KeyRound className="w-3.5 h-3.5" />,
}

function SidebarItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.href}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors group',
          isActive
            ? 'text-neutral-ink bg-neutral-surface font-semibold'
            : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
        )
      }
    >
      <span className="flex items-center gap-2">
        {item.icon && iconMap[item.icon] && (
          <span className="text-neutral-muted group-hover:text-neutral-charcoal">
            {iconMap[item.icon]}
          </span>
        )}
        {item.label}
      </span>
      {item.method && <MethodBadge method={item.method} />}
    </NavLink>
  )
}

export default function DocsSidebar() {
  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-neutral-line bg-white h-full overflow-y-auto">
      <nav className="py-6 px-3">
        {docsNav.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="px-3 mb-1 text-xs font-semibold text-neutral-muted uppercase tracking-wider">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
