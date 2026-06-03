import { AlertTriangle, XCircle, Info, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalloutVariant = 'warning' | 'error' | 'info' | 'success'

interface CalloutProps {
  variant?: CalloutVariant
  title?: string
  children: React.ReactNode
  className?: string
}

const variantConfig: Record<
  CalloutVariant,
  { bg: string; border: string; icon: React.ReactNode; titleColor: string }
> = {
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/50',
    icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    titleColor: 'text-amber-800 dark:text-amber-300',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800/50',
    icon: <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
    titleColor: 'text-red-800 dark:text-red-300',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/50',
    icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    titleColor: 'text-blue-800 dark:text-blue-300',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    titleColor: 'text-emerald-800 dark:text-emerald-300',
  },
}

export default function Callout({ variant = 'info', title, children, className }: CalloutProps) {
  const config = variantConfig[variant]

  return (
    <div className={cn('flex gap-3 p-4 rounded-lg border', config.bg, config.border, className)}>
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn('text-sm font-semibold mb-1', config.titleColor)}>{title}</p>
        )}
        <div className="text-sm text-neutral-slate leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
