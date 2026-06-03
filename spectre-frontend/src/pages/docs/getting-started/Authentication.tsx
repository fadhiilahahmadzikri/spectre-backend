import TableOfContents from '@/components/docs/TableOfContents'
import Callout from '@/components/docs/Callout'
import CodeBlock from '@/components/docs/CodeBlock'

const tocItems = [
  { label: 'Authentication', href: '#auth', level: 1 as const },
  { label: 'Kelola Key', href: '#manage', level: 2 as const },
]

const curlExample = `curl ... -H "X-API-Key: spk_xxxxxxxxxxxx"`

const sdkExample = `<SpectreAuthModal apiKey="spk_xxxxxxxxxxxx" ... />`

export default function Authentication() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">

        <div className="mb-8">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Getting Started</span>
          <h1 id="auth" className="text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Authentication
          </h1>
          <p className="text-base text-neutral-slate">
            Setiap request ke Spectre API membutuhkan API key via header{' '}
            <code className="font-mono text-[13px] bg-neutral-surface px-1.5 py-0.5 rounded text-neutral-ink">X-API-Key</code>.
          </p>
        </div>

        {/* Format */}
        <div className="mb-6 p-4 bg-neutral-surface border border-neutral-line rounded-xl">
          <p className="text-xs text-neutral-muted uppercase tracking-wide font-semibold mb-2">Format API Key</p>
          <code className="font-mono text-[13px] text-neutral-ink">spk_3b8c4f2a9d1e7b5c8f0a2d4e</code>
          <p className="text-xs text-neutral-muted mt-2">Key lengkap hanya tampil sekali saat generate. Simpan segera.</p>
        </div>

        <Callout variant="warning" className="mb-8">
          Jangan commit key ke repo. Gunakan <code className="font-mono text-xs">.env</code> dan pastikan file tersebut masuk <code className="font-mono text-xs">.gitignore</code>.
        </Callout>

        {/* Usage */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-neutral-ink mb-2">REST API:</p>
          <CodeBlock code={curlExample} language="bash" />
          <p className="text-sm font-semibold text-neutral-ink mt-4 mb-2">SDK React:</p>
          <CodeBlock code={sdkExample} language="tsx" />
        </div>

        {/* Manage */}
        <div id="manage" className="mb-8">
          <h2 className="text-lg font-bold text-neutral-ink mb-3">Kelola API Key</h2>
          <div className="border border-neutral-line rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-neutral-surface border-b border-neutral-line">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Aksi</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { action: 'Generate', desc: 'Applications → pilih app → API keys → Generate' },
                  { action: 'Revoke', desc: 'Nonaktifkan key — tidak bisa dipakai lagi setelah di-revoke' },
                  { action: 'Delete', desc: 'Hapus key yang tidak terpakai' },
                ].map((r, i) => (
                  <tr key={r.action} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
                    <td className="px-4 py-2.5 font-semibold text-neutral-ink whitespace-nowrap">{r.action}</td>
                    <td className="px-4 py-2.5 text-neutral-slate">{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </article>
      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#auth" />
      </div>
    </div>
  )
}
