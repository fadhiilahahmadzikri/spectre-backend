import { Link } from 'react-router-dom'
import MethodBadge from '@/components/docs/MethodBadge'
import type { NavMethod } from '@/config/docsNav'

const sections: { title: string; endpoints: { method: NavMethod; path: string; label: string; href: string; desc: string }[] }[] = [
  {
    title: 'Face Operations',
    endpoints: [
      { method: 'POST', path: '/api/v1/faces/register',        label: 'Register Face',      href: '/docs/register-face',      desc: 'Daftarkan wajah user dan simpan face embedding terenkripsi.' },
      { method: 'POST', path: '/api/v1/faces/authenticate',    label: 'Authenticate Face',  href: '/docs/authenticate-face',  desc: 'Verifikasi wajah — liveness, anti-spoof, dan face matching dalam satu call.' },
      { method: 'POST', path: '/api/v1/faces/replace',         label: 'Replace Face',       href: '/docs/replace-face',       desc: 'Ganti template biometrik yang sudah ada secara atomik.' },
      { method: 'DEL',  path: '/api/v1/faces/{external_user_id}', label: 'Delete Face',    href: '/docs/delete-face',        desc: 'Hapus face profile user secara permanen.' },
    ],
  },
  {
    title: 'Sessions',
    endpoints: [
      { method: 'GET', path: '/api/v1/sessions/{session_id}', label: 'Get Session', href: '/docs/get-session', desc: 'Ambil detail lengkap sesi autentikasi.' },
    ],
  },
  {
    title: 'Tenant Management',
    endpoints: [
      { method: 'POST', path: '/api/v1/applications',                      label: 'Create Application', href: '/docs/api-keys', desc: 'Buat aplikasi baru untuk menghasilkan API key.' },
      { method: 'POST', path: '/api/v1/applications/{id}/api-keys',        label: 'Generate API Key',   href: '/docs/api-keys', desc: 'Generate API key baru untuk aplikasi.' },
      { method: 'POST', path: '/api/v1/applications/{id}/api-keys/{kid}/revoke', label: 'Revoke API Key', href: '/docs/api-keys', desc: 'Nonaktifkan API key.' },
    ],
  },
]

export default function ApiReference() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="mb-8">
        <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Docs</span>
        <h1 className="text-3xl font-bold text-neutral-ink mt-3 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
          API Reference
        </h1>
        <p className="text-base text-neutral-slate">
          Semua endpoint Spectre REST API. Sertakan header{' '}
          <code className="font-mono text-[13px] bg-neutral-surface px-1.5 py-0.5 rounded text-neutral-ink">X-API-Key: spk_...</code>{' '}
          di setiap request.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-neutral-muted uppercase tracking-wider mb-3">
              {section.title}
            </h2>
            <div className="flex flex-col gap-2">
              {section.endpoints.map((ep) => (
                <Link
                  key={ep.path}
                  to={ep.href}
                  className="flex items-center gap-4 p-4 bg-neutral-white border border-neutral-line rounded-xl hover:border-neutral-charcoal/30 hover:shadow-sm transition-all group"
                >
                  <MethodBadge method={ep.method} size="md" />
                  <code className="font-mono text-[13px] text-neutral-ink flex-shrink-0 hidden sm:block">
                    {ep.path}
                  </code>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-ink sm:hidden">{ep.label}</p>
                    <p className="text-xs text-neutral-muted truncate">{ep.desc}</p>
                  </div>
                  <span className="text-neutral-muted group-hover:text-neutral-ink transition-colors flex-shrink-0 text-sm">→</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
