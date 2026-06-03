import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  label: string
  content: React.ReactNode
}

interface DocsTabsProps {
  tabs: Tab[]
  className?: string
}

export default function DocsTabs({ tabs, className }: DocsTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className={cn('rounded-lg border border-neutral-line overflow-x-auto', className)}>
      {/* Tab list */}
      <div className="flex bg-neutral-bg border-b border-neutral-line">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveIndex(i)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
              activeIndex === i
                ? 'bg-neutral-white text-neutral-ink border-neutral-ink'
                : 'text-neutral-muted hover:text-neutral-charcoal border-transparent hover:bg-neutral-surface'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab content */}
      <div className="bg-neutral-white">{tabs[activeIndex]?.content}</div>
    </div>
  )
}
