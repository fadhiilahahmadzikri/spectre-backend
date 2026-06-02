import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { docsNav } from '@/config/docsNav'
import type { NavItem } from '@/config/docsNav'
import MethodBadge from '@/components/docs/MethodBadge'
import { cn } from '@/lib/utils'

function SidebarItem({ item, onClose }: { item: NavItem; onClose?: () => void }) {
  return (
    <NavLink
      to={item.href}
      end
      onClick={onClose}
      className={({ isActive }) =>
        cn(
          'flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors',
          isActive
            ? 'text-neutral-ink bg-neutral-surface font-semibold'
            : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
        )
      }
    >
      <span>{item.label}</span>
      {item.method && <MethodBadge method={item.method} />}
    </NavLink>
  )
}

interface DocsSidebarProps {
  onClose?: () => void
}

export default function DocsSidebar({ onClose }: DocsSidebarProps) {
  return (
    <aside className="w-[260px] flex-shrink-0 border-r border-neutral-line bg-neutral-canvas dark:bg-neutral-canvas h-full">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-line lg:hidden">
          <span className="text-sm font-semibold text-neutral-ink">Menu</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-charcoal hover:bg-neutral-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <nav className="py-6 px-3">
        {docsNav.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="px-3 mb-1 text-xs font-semibold text-neutral-muted uppercase tracking-wider">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarItem key={item.href} item={item} onClose={onClose} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
