import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface TocItem {
  label: string
  href: string
  level?: 1 | 2 | 3
}

interface TableOfContentsProps {
  items: TocItem[]
  activeHref?: string
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeHref, setActiveHref] = useState(items[0]?.href ?? '')
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0, opacity: 0 })
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())

  // Update posisi indicator setiap kali activeHref berubah
  useEffect(() => {
    const el = itemRefs.current.get(activeHref)
    const nav = navRef.current
    if (!el || !nav) return
    const navRect = nav.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    setIndicatorStyle({
      top: elRect.top - navRect.top,
      height: elRect.height,
      opacity: 1,
    })
  }, [activeHref])

  // Scroll spy — deteksi heading yang sedang terlihat
  useEffect(() => {
    const ids = items.map(i => i.href.replace('#', ''))
    const elements = ids
      .map(id => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Ambil heading yang paling atas di viewport
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveHref(`#${visible[0].target.id}`)
        }
      },
      { rootMargin: '-10% 0px -70% 0px', threshold: 0 }
    )

    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault()
    const id = href.replace('#', '')
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Flash highlight sementara pada heading tujuan
      target.classList.remove('heading-flash')
      void target.offsetWidth // force reflow agar animasi restart
      target.classList.add('heading-flash')
      setTimeout(() => target.classList.remove('heading-flash'), 1300)
    }
    setActiveHref(href)
  }

  return (
    <aside className="w-56 flex-shrink-0 sticky top-24">
      <p className="text-[11px] font-semibold text-neutral-muted uppercase tracking-wider mb-3">
        On This Page
      </p>

      <nav ref={navRef} className="relative flex flex-col gap-0.5">
        {/* Sliding indicator */}
        <div
          className="absolute left-0 w-0.5 bg-neutral-ink rounded-full pointer-events-none"
          style={{
            top: indicatorStyle.top,
            height: indicatorStyle.height,
            opacity: indicatorStyle.opacity,
            transition: 'top 250ms cubic-bezier(0.4,0,0.2,1), height 250ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease',
          }}
        />

        {/* Border track kiri */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-neutral-line" />

        {items.map((item) => {
          const isActive = activeHref === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              ref={el => {
                if (el) itemRefs.current.set(item.href, el)
                else itemRefs.current.delete(item.href)
              }}
              onClick={e => handleClick(e, item.href)}
              className={cn(
                'relative text-sm py-1 pl-3 z-10 transition-colors duration-200',
                item.level === 2 ? 'pl-5' : item.level === 3 ? 'pl-7' : '',
                isActive
                  ? 'text-neutral-ink font-semibold'
                  : 'text-neutral-muted hover:text-neutral-charcoal'
              )}
            >
              {item.label}
            </a>
          )
        })}
      </nav>
    </aside>
  )
}
