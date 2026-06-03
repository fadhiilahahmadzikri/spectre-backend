import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import SpecterLogo from '@/components/ui/SpecterLogo'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const analyticsUrl = (import.meta.env.VITE_ANALYTICS_URL as string) || 'https://specter-app-gqlsidwhv67jrrgsz8f22b.streamlit.app/'

  const navLinks = [
    { label: 'Documentation', href: '/docs/introduction' },
    { label: 'API Reference', href: '/api-reference' },
    { label: 'SDKs', href: '/sdks' },
    { label: 'Changelog', href: '/changelog' },
  ]

  return (
    <nav className="sticky top-0 z-50 h-16 bg-neutral-canvas border-b border-neutral-line">
      <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <SpecterLogo className="h-[22px] w-auto" />
        </Link>

        {/* Center nav links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'text-neutral-ink bg-neutral-surface'
                    : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {analyticsUrl && (
            <a
              href={analyticsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface"
            >
              Analytics
            </a>
          )}
        </div>

        {/* Right actions — desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-md text-sm font-medium text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-1.5 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-[#240CF6] to-[#92F8FF] hover:opacity-90 transition-opacity shadow-sm"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-neutral-charcoal hover:bg-neutral-surface transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ originY: 0 }}
            className="md:hidden bg-neutral-canvas border-b border-neutral-line px-4 pb-4"
          >
            <div className="flex flex-col gap-1 pt-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'text-neutral-ink bg-neutral-surface font-semibold'
                        : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {analyticsUrl && (
                <a
                  href={analyticsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface"
                >
                  Analytics
                </a>
              )}
              <div className="border-t border-neutral-line mt-2 pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium text-neutral-charcoal hover:bg-neutral-surface transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-[#240CF6] to-[#92F8FF] text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
