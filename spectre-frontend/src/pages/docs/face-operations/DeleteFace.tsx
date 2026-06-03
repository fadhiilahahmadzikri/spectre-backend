import { CheckCircle2, XCircle } from 'lucide-react'
import EndpointBar from '@/components/docs/EndpointBar'
import CodeBlock from '@/components/docs/CodeBlock'
import TableOfContents from '@/components/docs/TableOfContents'
import Callout from '@/components/docs/Callout'

const tocItems = [
  { label: 'Delete Face', href: '#delete-face', level: 1 as const },
]

const curlExample = `curl -X DELETE {BASE_URL}/api/v1/faces/user%40email.com \\
  -H "X-API-Key: spk_xxxxxxxxxxxx"`

const successResponse = `{ "message": "Face profile deleted successfully." }`

export default function DeleteFace() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">

        <div className="mb-6">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Face Operations</span>
          <h1 id="delete-face" className="text-3xl font-bold text-neutral-ink mt-3 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
            Delete Face
          </h1>
          <p className="text-base text-neutral-slate">
            Hapus face profile user secara permanen. User perlu register ulang untuk bisa authenticate lagi.
          </p>
        </div>

        <EndpointBar method="DEL" path="/api/v1/faces/{external_user_id}" />

        <Callout variant="error" className="mt-5 mb-6">
          Tidak bisa di-undo. Template biometrik dihancurkan permanen.
        </Callout>

        <div className="mb-6 p-4 bg-neutral-surface border border-neutral-line rounded-xl text-sm">
          <p className="font-semibold text-neutral-ink mb-1">Path parameter</p>
          <p className="text-neutral-slate">
            <code className="font-mono text-[12px]">external_user_id</code> — URL-encode karakter khusus
            (mis. <code className="font-mono text-[12px]">@</code> → <code className="font-mono text-[12px]">%40</code>)
          </p>
        </div>

        <CodeBlock code={curlExample} language="bash" filename="delete.sh" />

        <div className="mt-4">
          <p className="text-xs text-neutral-muted mb-1.5 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /> 200 OK</p>
          <CodeBlock code={successResponse} language="json" />
          <p className="text-xs text-neutral-muted mt-3 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" /> 404 — tidak ada face profile untuk user tersebut.</p>
        </div>

      </article>
      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#delete-face" />
      </div>
    </div>
  )
}
