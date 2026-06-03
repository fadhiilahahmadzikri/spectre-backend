interface Param {
  name: string
  type: string
  required?: boolean
  description: string
}

interface ParamTableProps {
  params: Param[]
  title?: string
}

export default function ParamTable({ params, title }: ParamTableProps) {
  return (
    <div className="my-4">
      {title && (
        <p className="text-sm font-semibold text-neutral-ink mb-2">{title}</p>
      )}
      <div className="border border-neutral-line rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-surface border-b border-neutral-line">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">
                Type
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">
                Required
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {params.map((param, i) => (
              <tr
                key={param.name}
                className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}
              >
                <td className="px-4 py-2.5">
                  <code className="font-mono text-[13px] text-neutral-ink">{param.name}</code>
                </td>
                <td className="px-4 py-2.5">
                  <code className="font-mono text-[13px] text-neutral-slate">{param.type}</code>
                </td>
                <td className="px-4 py-2.5">
                  {param.required ? (
                    <span className="text-[11px] font-medium text-neutral-ink bg-neutral-ink/10 px-1.5 py-0.5 rounded">
                      required
                    </span>
                  ) : (
                    <span className="text-[11px] text-neutral-muted">optional</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-neutral-slate">{param.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
