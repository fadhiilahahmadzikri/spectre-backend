import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Settings, House, BookOpen, Menu, MoreVertical, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import SpecterIcon from '@/components/ui/SpecterIcon'
import DocsSearch from '@/components/docs/DocsSearch'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { useAuthStore } from '@/lib/store'

interface DocsTopbarProps {
  onMenuToggle?: () => void
}

export default function DocsTopbar({ onMenuToggle }: DocsTopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isLoggedIn = useAuthStore(s => !!s.accessToken)

  const analyticsUrl = (import.meta.env.VITE_ANALYTICS_URL as string) || 'https://specter-app-gqlsidwhv67jrrgsz8f22b.streamlit.app/'

  const tabs = [
    { label: 'API Reference', href: '/api-reference' },
    { label: 'SDKs', href: '/sdks' },
    { label: 'Changelog', href: '/changelog' },
  ]

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 bg-neutral-canvas dark:bg-neutral-canvas border-b border-neutral-line">
        {/* Topbar utama */}
        <div className="h-14 flex items-center px-4 gap-3">
          {/* Logo — selalu tampil termasuk teks */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <SpecterIcon className="h-[20px] w-auto" />
            <span className="font-bold text-sm text-neutral-ink">Specter</span>
          </Link>

          {/* Badge — hanya sm+ */}
          <span className="hidden sm:block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-surface border border-neutral-line text-neutral-charcoal flex-shrink-0">
            v0.1
          </span>

          {/* Nav desktop */}
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            <div className="w-px h-4 bg-neutral-line mx-1" />
            <Link to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface transition-colors">
              <House className="w-3.5 h-3.5" />Beranda
            </Link>
            <NavLink to="/docs/introduction"
              className={({ isActive }) => cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                isActive ? 'text-neutral-ink bg-neutral-surface font-semibold' : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
              )}>
              <BookOpen className="w-3.5 h-3.5" />Docs
            </NavLink>
            <div className="w-px h-4 bg-neutral-line mx-1" />
            {tabs.map(tab => (
              <NavLink key={tab.href} to={tab.href}
                className={({ isActive }) => cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive ? 'text-neutral-ink bg-neutral-surface font-semibold' : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
                )}>
                {tab.label}
              </NavLink>
            ))}
            <div className="w-px h-4 bg-neutral-line mx-1" />
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

          {/* Search */}
          <div className="ml-auto min-w-0 w-[220px] hidden sm:block">
            <button onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm bg-neutral-surface border border-neutral-line rounded-lg hover:border-neutral-charcoal/30 transition-colors text-left">
              <Search className="w-3.5 h-3.5 text-neutral-muted flex-shrink-0" />
              <span className="flex-1 text-neutral-muted text-xs truncate">Cari dokumentasi...</span>
              <kbd className="hidden md:block px-1.5 py-0.5 text-[10px] font-mono bg-neutral-white border border-neutral-line rounded text-neutral-muted flex-shrink-0">⌘K</kbd>
            </button>
          </div>

          {/* Right actions — ml-auto di mobile agar mepet kanan */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto sm:ml-0">
            <button onClick={() => setSearchOpen(true)}
              className="sm:hidden p-2 rounded-md text-neutral-charcoal hover:bg-neutral-surface transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <ThemeToggle />
            <button className="hidden sm:flex p-2 rounded-md text-neutral-charcoal hover:bg-neutral-surface transition-colors">
              <Settings className="w-4 h-4" />
            </button>
            <Link
              to={isLoggedIn ? '/app' : '/login'}
              className="hidden sm:flex px-3 py-1.5 rounded-md text-xs font-semibold text-white dark:text-neutral-ink bg-neutral-ink dark:bg-neutral-surface dark:border dark:border-neutral-charcoal hover:bg-neutral-charcoal dark:hover:bg-neutral-surface transition-colors">
              {isLoggedIn ? 'Dashboard' : 'Login'}
            </Link>

            {/* 3-dot menu — pojok kanan atas, mobile only */}
            <button onClick={() => setMobileMenuOpen(v => !v)}
              className="lg:hidden p-2 rounded-md text-neutral-charcoal hover:bg-neutral-surface transition-colors"
              aria-label="Menu">
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Strip "Docs Navigation" — hanya mobile, di bawah topbar */}
        <div className="lg:hidden border-t border-neutral-line">
          <button
            onClick={() => { onMenuToggle?.(); setMobileMenuOpen(false) }}
            className="w-full flex items-center gap-3 px-5 py-3 text-sm text-neutral-charcoal hover:bg-neutral-surface transition-colors"
          >
            <Menu className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold text-neutral-ink">Docs Navigation</span>
            <ChevronRight className="w-4 h-4 ml-auto text-neutral-muted" />
          </button>
        </div>
      </header>

      {/* Mobile full-screen menu — berisi nav links */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden fixed inset-0 z-50 flex flex-col bg-neutral-canvas dark:bg-neutral-canvas"
            style={{ top: 0 }}
          >
            {/* Header menu */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-neutral-line flex-shrink-0">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <SpecterIcon className="h-[20px] w-auto" />
                <span className="font-bold text-sm text-neutral-ink">Specter</span>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-md text-neutral-charcoal hover:bg-neutral-surface transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Isi menu */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
              {/* Main nav */}
              <NavLink to="/" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface transition-colors">
                <House className="w-4 h-4" />Beranda
              </NavLink>
              <NavLink to="/docs/introduction" onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'text-neutral-ink bg-neutral-surface font-semibold' : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
                )}>
                <BookOpen className="w-4 h-4" />Docs
              </NavLink>

              <div className="h-px bg-neutral-line my-2" />

              {tabs.map(tab => (
                <NavLink key={tab.href} to={tab.href} onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => cn(
                    'px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive ? 'text-neutral-ink bg-neutral-surface font-semibold' : 'text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface'
                  )}>
                  {tab.label}
                </NavLink>
              ))}
              {analyticsUrl && (
                <a
                  href={analyticsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-neutral-charcoal hover:text-neutral-ink hover:bg-neutral-surface"
                >
                  Analytics
                </a>
              )}
            </div>

            {/* Footer menu */}
            <div className="px-4 py-4 border-t border-neutral-line flex items-center gap-2">
              <ThemeToggle />
              <Link
                to={isLoggedIn ? '/app' : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-semibold text-white dark:text-neutral-ink bg-neutral-ink dark:bg-neutral-surface dark:border dark:border-neutral-charcoal">
                {isLoggedIn ? 'Dashboard' : 'Login'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DocsSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
