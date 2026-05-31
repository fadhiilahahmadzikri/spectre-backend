import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import SpecterLogo from '@/components/ui/SpecterLogo'

export default function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { label: 'Documentation', href: '/docs/introduction' },
    { label: 'API Reference', href: '/api-reference' },
    { label: 'SDKs', href: '/sdks' },
    { label: 'Changelog', href: '/changelog' },
  ]

  return (
    <div className="w-full flex justify-center px-6 pt-6 pb-0">
      {/* Pill container */}
      <div className="w-full max-w-[960px] relative">
        <div className="flex items-center justify-between h-[64px] px-5 rounded-full border border-black/10 bg-white shadow-sm">
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
                      ? 'text-neutral-ink bg-neutral-surface'
                      : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right: Sign In + CTA */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-full text-sm font-medium text-neutral-charcoal hover:text-neutral-ink transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-br from-[#57555A] to-[#040404] hover:opacity-85 transition-opacity shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-full text-neutral-charcoal hover:bg-neutral-surface transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden mt-2 bg-white border border-black/10 rounded-2xl shadow-card-hover px-4 py-3">
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
                        ? 'text-neutral-ink bg-neutral-surface font-semibold'
                        : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="border-t border-neutral-line mt-2 pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-xl text-sm font-medium text-neutral-charcoal hover:bg-neutral-surface transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-[#57555A] to-[#040404] text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
