import type { NavMethod } from '@/config/docsNav'
import { cn } from '@/lib/utils'

interface MethodBadgeProps {
  method: NavMethod
  size?: 'sm' | 'md'
}

const methodConfig: Record<NavMethod, { cls: string; dot: string }> = {
  POST:  { cls: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500 dark:bg-emerald-400' },
  GET:   { cls: 'bg-blue-100    dark:bg-blue-950/60    text-blue-700    dark:text-blue-400',    dot: 'bg-blue-500    dark:bg-blue-400'    },
  DEL:   { cls: 'bg-red-100     dark:bg-red-950/60     text-red-700     dark:text-red-400',     dot: 'bg-red-500     dark:bg-red-400'     },
  PUT:   { cls: 'bg-amber-100   dark:bg-amber-950/60   text-amber-700   dark:text-amber-400',   dot: 'bg-amber-500   dark:bg-amber-400'   },
  PATCH: { cls: 'bg-violet-100  dark:bg-violet-950/60  text-violet-700  dark:text-violet-400',  dot: 'bg-violet-500  dark:bg-violet-400'  },
}

export default function MethodBadge({ method, size = 'sm' }: MethodBadgeProps) {
  const { cls, dot } = methodConfig[method]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono font-bold rounded-md uppercase tracking-wider',
        cls,
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2.5 py-1'
      )}
    >
      <span className={cn('rounded-full flex-shrink-0', dot, size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5')} />
      {method}
    </span>
  )
}
