import DocsLayout from '@/components/layout/DocsLayout'
import { Link } from 'react-router-dom'

const sections = [
  {
    title: 'Face Operations',
    endpoints: [
      { method: 'POST' as const, path: '/v1/faces/register', label: 'Register Face', href: '/docs/register-face', desc: 'Create a biometric record for a user.' },
      { method: 'POST' as const, path: '/v1/faces/authenticate', label: 'Authenticate Face', href: '/docs/authenticate-face', desc: 'Verify a live face capture against a registered template.' },
      { method: 'POST' as const, path: '/v1/faces/replace', label: 'Replace Face', href: '/docs/replace-face', desc: 'Atomically replace an existing biometric record.' },
      { method: 'DEL' as const, path: '/v1/faces/{external_user_id}', label: 'Delete Face', href: '/docs/delete-face', desc: 'Permanently destroy a user\'s biometric record.' },
    ],
  },
  {
    title: 'Sessions',
    endpoints: [
      { method: 'GET' as const, path: '/v1/sessions/{session_id}', label: 'Get Session', href: '/docs/get-session', desc: 'Retrieve full details of a completed session.' },
    ],
  },
]

import MethodBadge from '@/components/docs/MethodBadge'

function ApiReferenceContent() {
  return (
    <div className="px-8 py-10 max-w-4xl">
      <h1 className="text-3xl font-bold text-neutral-ink mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
        API Reference
      </h1>
      <p className="text-base text-neutral-slate mb-10 leading-relaxed">
        Complete reference for all Specter REST API endpoints. Base URL:{' '}
        <code className="font-mono text-[13px] bg-neutral-surface px-1.5 rounded">
          https://api.faceguard.io/v1
        </code>
      </p>

      {sections.map((section) => (
        <div key={section.title} className="mb-12">
          <h2 className="text-xl font-bold text-neutral-ink mb-5">{section.title}</h2>
          <div className="flex flex-col gap-3">
            {section.endpoints.map((ep) => (
              <Link
                key={ep.href}
                to={ep.href}
                className="flex items-start gap-4 p-4 bg-white border border-neutral-line rounded-xl hover:shadow-card-hover hover:border-[#240CF6]/20 transition-all group"
              >
                <div className="pt-0.5 flex-shrink-0">
                  <MethodBadge method={ep.method} size="md" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <code className="font-mono text-sm text-neutral-ink">{ep.path}</code>
                  </div>
                  <p className="text-sm font-medium text-neutral-ink mb-0.5">{ep.label}</p>
                  <p className="text-xs text-neutral-muted">{ep.desc}</p>
                </div>
                <span className="text-neutral-muted group-hover:text-[#240CF6] transition-colors text-lg">→</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// This page renders standalone (not inside DocsLayout) since it's its own route
export default function ApiReference() {
  return (
    <div className="min-h-screen bg-neutral-canvas flex flex-col">
      <div className="flex flex-1">
        <main className="flex-1">
          <ApiReferenceContent />
        </main>
      </div>
    </div>
  )
}

// Also export wrapped version for use inside DocsLayout
export { DocsLayout, ApiReferenceContent }
