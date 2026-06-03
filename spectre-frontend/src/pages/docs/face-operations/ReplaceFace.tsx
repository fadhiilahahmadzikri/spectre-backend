import EndpointBar from '@/components/docs/EndpointBar'
import ParamTable from '@/components/docs/ParamTable'
import CodeBlock from '@/components/docs/CodeBlock'
import TableOfContents from '@/components/docs/TableOfContents'
import Callout from '@/components/docs/Callout'

const tocItems = [
  { label: 'Replace Face', href: '#replace-face', level: 1 as const },
  { label: 'Request Body', href: '#body', level: 2 as const },
  { label: 'Example', href: '#example', level: 2 as const },
  { label: 'Response', href: '#response', level: 2 as const },
]

const bodyParams = [
  { name: 'external_user_id', type: 'string', required: true, description: 'The user whose biometric record will be replaced.' },
  { name: 'image_base64', type: 'string', required: true, description: 'New base64-encoded JPEG or PNG face image. Min 300×300px.' },
  { name: 'reason', type: 'string', required: false, description: 'Optional reason for the replacement (e.g. "user_request", "quality_improvement"). Logged in audit trail.' },
]

const curlExample = `curl -X POST https://api.faceguard.io/v1/faces/replace \\
  -H "Content-Type: application/json" \\
  -H "X-Specter-Key: sk_live_xxxxxxxxxxxx" \\
  -d '{
    "external_user_id": "user_abc123",
    "image_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "reason": "user_request"
  }'`

const successResponse = `{
  "success": true,
  "session_id": "ses_02K0L3N4O5P6Q7R8S9T0U1V2W",
  "external_user_id": "user_abc123",
  "status": "replaced",
  "previous_face_id": "fce_01A2B3C4D5E6F7G8H9I0J1K2L",
  "new_face_id": "fce_09Z8Y7X6W5V4U3T2S1R0Q9P8O",
  "updated_at": "2025-11-01T14:22:11Z"
}`

export default function ReplaceFace() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">
        <div className="mb-6">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">
            Face Operations
          </span>
          <h1 id="replace-face" className="text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Replace Face
          </h1>
          <p className="text-base text-neutral-slate leading-relaxed">
            Replaces the existing biometric template for a user with a new one. The previous
            embedding is permanently deleted and replaced atomically — there is no window where
            the user has no face registered.
          </p>
        </div>

        <EndpointBar method="POST" path="/v1/faces/replace" />

        <Callout variant="warning" className="mb-6">
          This operation requires a <strong>secret key</strong> (<code className="font-mono text-xs">sk_live_</code>).
          It cannot be called from client-side code. Always invoke from your backend.
        </Callout>

        {/* Body */}
        <div id="body" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Request Body</h2>
          <ParamTable params={bodyParams} />
        </div>

        {/* Example */}
        <div id="example" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Example Request</h2>
          <CodeBlock code={curlExample} language="bash" filename="replace-face.sh" />
        </div>

        {/* Response */}
        <div id="response" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Success Response</h2>
          <p className="text-sm text-neutral-slate mb-3">
            Returns HTTP <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">200 OK</code> on success.
            Both the old and new face IDs are returned for audit purposes.
          </p>
          <CodeBlock code={successResponse} language="json" filename="response.json" />
        </div>
      </article>

      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#replace-face" />
      </div>
    </div>
  )
}
