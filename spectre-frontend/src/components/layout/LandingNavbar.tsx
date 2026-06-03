import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import SpecterLogo from '@/components/ui/SpecterLogo'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useAuthStore } from '@/lib/store'

export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const isLoggedIn = useAuthStore(s => !!s.accessToken)
  const ctaPath = isLoggedIn ? '/app' : '/login'

  const analyticsUrl = import.meta.env.VITE_ANALYTICS_URL as string

  const navLinks = [
    { label: 'Documentation', href: '/docs/introduction' },
    { label: 'API Reference', href: '/api-reference' },
    { label: 'SDKs', href: '/sdks' },
    { label: 'Changelog', href: '/changelog' },
  ]

  return (
    <div className="w-full flex justify-center px-6 pt-6 pb-0">
      <div className="w-full max-w-[960px] relative">
        {/* Pill navbar */}
        <div className="flex items-center justify-between h-[64px] px-5 rounded-full border border-neutral-line bg-neutral-white dark:bg-neutral-surface shadow-sm">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <SpecterLogo className="h-[20px] w-auto" />
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    isActive
                      ? 'text-neutral-ink bg-neutral-surface dark:bg-neutral-canvas'
                      : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface dark:hover:bg-neutral-canvas'
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
                className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface dark:hover:bg-neutral-canvas"
              >
                Analytics
              </a>
            )}
          </div>

          {/* Right: theme toggle + Sign In + CTA */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <ThemeToggle shape="circle" />
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-full text-sm font-medium text-neutral-charcoal hover:text-neutral-ink transition-colors"
            >
              Sign In
            </Link>
            <Link
              to={ctaPath}
              className="px-5 py-2 rounded-full text-sm font-semibold text-white dark:text-neutral-ink bg-gradient-to-br from-[#57555A] to-[#040404] dark:bg-none dark:bg-neutral-surface dark:border dark:border-neutral-charcoal hover:opacity-85 transition-opacity shadow-sm dark:shadow-none"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle shape="circle" />
            <button
              className="p-2 rounded-full text-neutral-charcoal hover:bg-neutral-surface transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -8, scaleY: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ originY: 0 }}
              className="md:hidden mt-2 bg-neutral-white dark:bg-neutral-surface border border-neutral-line rounded-2xl shadow-card-hover px-4 py-3"
            >
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'text-neutral-ink bg-neutral-surface dark:bg-neutral-canvas font-semibold'
                          : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface dark:hover:bg-neutral-canvas'
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
                    className="px-3 py-2 rounded-xl text-sm font-medium transition-colors text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface dark:hover:bg-neutral-canvas"
                  >
                    Analytics
                  </a>
                )}
                <div className="border-t border-neutral-line mt-2 pt-2 flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 rounded-xl text-sm font-medium text-neutral-charcoal hover:bg-neutral-surface transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to={ctaPath}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white dark:text-neutral-ink bg-gradient-to-br from-[#57555A] to-[#040404] dark:bg-none dark:bg-neutral-surface dark:border dark:border-neutral-charcoal text-center"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
