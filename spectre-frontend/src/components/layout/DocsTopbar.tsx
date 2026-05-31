import { Link, NavLink } from 'react-router-dom'
import { Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import SpecterIcon from '@/components/ui/SpecterIcon'

export default function DocsTopbar() {
  const tabs = [
    { label: 'API Reference', href: '/api-reference' },
    { label: 'SDKs', href: '/sdks' },
    { label: 'Changelog', href: '/changelog' },
  ]

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-neutral-line flex items-center">
      <div className="flex items-center w-full px-6 gap-4">
        {/* Left: logo + badge + tabs */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <SpecterIcon className="h-[22px] w-auto" />
            <span className="font-bold text-sm text-neutral-ink">Specter</span>
          </Link>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-surface border border-neutral-line text-neutral-charcoal">
            v0.1
          </span>
          <div className="hidden lg:flex items-center gap-1 ml-2">
            {tabs.map((tab) => (
              <NavLink
                key={tab.href}
                to={tab.href}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'text-neutral-ink bg-neutral-surface font-semibold'
                      : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Center: search */}
        <div className="flex-1 max-w-md mx-auto hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-muted" />
            <input
              type="text"
              placeholder="Search documentation..."
              className="w-full pl-9 pr-12 py-2 text-sm bg-neutral-surface border border-neutral-line rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-charcoal/20 focus:border-neutral-charcoal/40 placeholder:text-neutral-muted"
              readOnly
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono bg-white border border-neutral-line rounded text-neutral-muted">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: settings + dashboard */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <button className="p-2 rounded-md text-neutral-charcoal hover:bg-neutral-surface transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <Link
            to="/app"
            className="px-4 py-1.5 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-[#240CF6] to-[#92F8FF] hover:opacity-90 transition-opacity shadow-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  )
}
