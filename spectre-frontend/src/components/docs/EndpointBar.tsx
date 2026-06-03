import type { NavMethod } from '@/config/docsNav'
import MethodBadge from './MethodBadge'

interface EndpointBarProps {
  method: NavMethod
  path: string
}

const accentMap: Record<NavMethod, string> = {
  POST:  'border-l-emerald-400',
  GET:   'border-l-blue-400',
  DEL:   'border-l-red-400',
  PUT:   'border-l-amber-400',
  PATCH: 'border-l-violet-400',
}

export default function EndpointBar({ method, path }: EndpointBarProps) {
  return (
    <div className={`flex items-center gap-3 bg-neutral-surface border border-neutral-line border-l-2 ${accentMap[method]} rounded-lg px-4 py-3 my-4`}>
      <MethodBadge method={method} size="md" />
      <code className="font-mono text-sm text-neutral-ink flex-1">{path}</code>
    </div>
  )
}
