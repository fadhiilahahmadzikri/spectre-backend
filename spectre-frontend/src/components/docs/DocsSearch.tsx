import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, ArrowRight, CornerDownLeft } from 'lucide-react'
import { docsNav } from '@/config/docsNav'
import MethodBadge from '@/components/docs/MethodBadge'
import type { NavMethod } from '@/config/docsNav'

interface SearchResult {
  label: string
  href: string
  group: string
  method?: NavMethod
}

// Flatten semua item dari docsNav menjadi daftar searchable
const ALL_ITEMS: SearchResult[] = docsNav.flatMap((group) =>
  group.items.map((item) => ({
    label: item.label,
    href: item.href,
    group: group.title,
    method: item.method,
  }))
)

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-neutral-ink/10 text-neutral-ink rounded px-0.5 not-italic font-semibold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function DocsSearch({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = query.trim()
    ? ALL_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.group.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_ITEMS

  // Reset active index when results change
  useEffect(() => { setActiveIdx(0) }, [query])

  // Focus input when opened, reset query when closed
  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const navigate_to = useCallback((href: string) => {
    navigate(href)
    onClose()
  }, [navigate, onClose])

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (results[activeIdx]) navigate_to(results[activeIdx].href)
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [activeIdx, results, navigate_to, onClose])

  if (!open) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg bg-neutral-canvas dark:bg-neutral-canvas rounded-xl shadow-2xl border border-neutral-line overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-line">
          <Search className="w-4 h-4 text-neutral-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Cari dokumentasi..."
            className="flex-1 text-sm text-neutral-ink placeholder:text-neutral-muted bg-transparent outline-none"
          />
          <kbd className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-mono bg-neutral-surface border border-neutral-line rounded text-neutral-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[340px] overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-muted">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              {/* Group results by section */}
              {(query.trim() ? [{ title: 'Hasil', items: results }] : docsNav.map(g => ({
                title: g.title,
                items: ALL_ITEMS.filter(i => i.group === g.title),
              }))).map((group) => (
                <div key={group.title}>
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-neutral-muted uppercase tracking-wider">
                    {group.title}
                  </p>
                  {group.items.map((item) => {
                    const idx = results.indexOf(item)
                    const isActive = idx === activeIdx
                    return (
                      <button
                        key={item.href}
                        data-idx={idx}
                        onClick={() => navigate_to(item.href)}
                        onMouseEnter={() => setActiveIdx(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isActive ? 'bg-neutral-surface' : 'hover:bg-neutral-surface/50'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-neutral-muted flex-shrink-0" />
                        <span className="flex-1 text-sm text-neutral-ink">
                          {highlight(item.label, query)}
                        </span>
                        {item.method && <MethodBadge method={item.method} />}
                        {isActive && <ArrowRight className="w-3.5 h-3.5 text-neutral-muted flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-neutral-line bg-neutral-surface/50">
          <span className="flex items-center gap-1 text-[11px] text-neutral-muted">
            <CornerDownLeft className="w-3 h-3" /> pilih
          </span>
          <span className="flex items-center gap-1 text-[11px] text-neutral-muted">
            <span className="font-mono">↑↓</span> navigasi
          </span>
          <span className="flex items-center gap-1 text-[11px] text-neutral-muted">
            <kbd className="px-1 py-0.5 text-[10px] font-mono bg-neutral-surface border border-neutral-line rounded">ESC</kbd> tutup
          </span>
        </div>
      </div>
    </div>
  )
}
