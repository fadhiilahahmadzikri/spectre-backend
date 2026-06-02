import { useState } from 'react'
import { Link } from 'react-router-dom'
import SpecterLogo from '@/components/ui/SpecterLogo'

const usefulLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

const followLinks = [
  { label: 'Facebook', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'X', href: '#' },
]

export default function Footer() {
  const [email, setEmail] = useState('')

  return (
    <footer className="bg-neutral-surface border border-neutral-line rounded-2xl mb-6 shadow-card max-w-5xl mx-auto" style={{ width: 'calc(100% - 4rem)' }}>
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-3">

        {/* Main footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-4">

          {/* Logo + description */}
          <div className="md:col-span-2" >
            <Link to="/" className="inline-flex mb-3">
              <SpecterLogo className="h-[28px] w-auto" />
            </Link>
            <p className="text-xs text-neutral-charcoal leading-relaxed">
              Streamline your business financial management with our simple, scalable SaaS platform. Designed for US enterprises our solutions simplify complex processes.
            </p>
          </div>

          {/* Useful Links */}
          <div>
            <p className="text-xs font-semibold text-neutral-ink mb-3">Useful Link</p>
            <ul className="flex flex-col gap-1">
              {usefulLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-xs text-neutral-charcoal hover:text-neutral-ink transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <p className="text-xs font-semibold text-neutral-ink mb-3">Follow Us</p>
            <ul className="flex flex-col gap-1">
              {followLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-xs text-neutral-charcoal hover:text-neutral-ink transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-neutral-ink mb-3">Subscribe our newsletter</p>
            <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-full border border-neutral-line bg-neutral-canvas">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 min-w-0 px-2.5 text-xs bg-transparent placeholder:text-neutral-muted focus:outline-none"
              />
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white dark:text-neutral-ink bg-neutral-ink dark:bg-neutral-surface dark:border dark:border-neutral-charcoal hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-3 border-t border-neutral-line">
          <p className="text-xs text-neutral-muted">Powered by RetailNow corp</p>
        </div>
      </div>
    </footer>
  )
}
