import { Sparkles, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import CodeBlock from '@/components/docs/CodeBlock'
import TableOfContents from '@/components/docs/TableOfContents'
import Callout from '@/components/docs/Callout'

const tocItems = [
  { label: 'Quickstart', href: '#quickstart', level: 1 as const },
  { label: '1. API Key', href: '#api-key', level: 2 as const },
  { label: '2. Install SDK', href: '#install', level: 2 as const },
  { label: '3. Pasang Scanner', href: '#sdk', level: 2 as const },
]

const installCode = `npm install @thewhitenigs/spectre-snap`

const sdkExample = `import { useState } from "react";
import { SpectreAuthModal } from "@thewhitenigs/spectre-snap";
import type { SpectreAuthResult, SpectreFailureReason } from "@thewhitenigs/spectre-snap";

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Verifikasi Wajah</button>

      <SpectreAuthModal
        open={open}
        onOpenChange={setOpen}
        apiKey={import.meta.env.VITE_SPECTRE_API_KEY}
        userId="user@email.com"         // ID unik user — gunakan selalu konsisten
        mode="auto"                     // register jika baru, authenticate jika sudah ada
        onSuccess={(r: SpectreAuthResult) => { setOpen(false); /* redirect... */ }}
        onFailed={(reason: SpectreFailureReason) => { /* SDK tampilkan error sendiri */ }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}`

const envCode = `VITE_SPECTRE_API_KEY=spk_xxxxxxxxxxxx`

export default function Quickstart() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">

        <div className="mb-8">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Getting Started</span>
          <h1 id="quickstart" className="text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Quickstart
          </h1>
          <p className="text-base text-neutral-slate">
            Tiga langkah untuk menjalankan scanner wajah Spectre di aplikasi kamu.
          </p>
        </div>

        {/* Step 1 */}
        <section id="api-key" className="mb-10">
          <h2 className="text-lg font-bold text-neutral-ink mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-neutral-ink dark:bg-neutral-surface dark:border dark:border-neutral-charcoal text-white dark:text-neutral-ink text-[11px] font-bold flex items-center justify-center flex-shrink-0">1</span>
            Buat Aplikasi & API Key
          </h2>
          <div className="flex flex-col gap-1.5 text-sm text-neutral-slate mb-3">
            <p>→ <strong className="text-neutral-ink">Applications</strong> › New application › isi nama › simpan</p>
            <p>→ Buka aplikasi › <strong className="text-neutral-ink">API keys</strong> › Generate</p>
            <p>→ Salin key — <strong className="text-neutral-ink">hanya ditampilkan sekali</strong></p>
          </div>
          <div>
            <Callout variant="warning">
              Simpan di <code className="font-mono text-xs">.env</code>, jangan hardcode di kode.
            </Callout>
            <CodeBlock code={envCode} language="bash" filename=".env" className="mt-3" />
          </div>
        </section>

        {/* Step 2 */}
        <section id="install" className="mb-10">
          <h2 className="text-lg font-bold text-neutral-ink mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-neutral-ink dark:bg-neutral-surface dark:border dark:border-neutral-charcoal text-white dark:text-neutral-ink text-[11px] font-bold flex items-center justify-center flex-shrink-0">2</span>
            Install SDK
          </h2>
          <div>
            <CodeBlock code={installCode} language="bash" />
          </div>
        </section>

        {/* Step 3 */}
        <section id="sdk" className="mb-10">
          <h2 className="text-lg font-bold text-neutral-ink mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-neutral-ink dark:bg-neutral-surface dark:border dark:border-neutral-charcoal text-white dark:text-neutral-ink text-[11px] font-bold flex items-center justify-center flex-shrink-0">3</span>
            Pasang Scanner
          </h2>
          <div>
            <CodeBlock code={sdkExample} language="tsx" filename="App.tsx" />

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { prop: 'apiKey', desc: 'API key dari dashboard.' },
                { prop: 'userId', desc: 'ID unik user. Konsisten setiap login.' },
                { prop: 'mode="auto"', desc: 'Register jika baru, auth jika sudah ada.' },
              ].map(p => (
                <div key={p.prop} className="p-3 bg-neutral-surface rounded-lg border border-neutral-line">
                  <code className="text-[12px] font-mono text-neutral-ink block mb-1">{p.prop}</code>
                  <p className="text-[12px] text-neutral-slate">{p.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-neutral-ink dark:bg-neutral-surface dark:border dark:border-neutral-charcoal rounded-xl text-white dark:text-neutral-ink">
              <p className="font-semibold text-sm flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Selesai!</p>
              <p className="text-xs text-white/60 dark:text-neutral-muted mt-0.5">Lihat referensi endpoint untuk detail lengkap.</p>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                to="/docs/register-face"
                className="group flex items-center justify-between p-4 rounded-xl border border-neutral-line bg-neutral-surface hover:bg-neutral-line transition-colors"
              >
                <div>

                  <p className="text-sm font-semibold text-neutral-ink">Register Face</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-muted group-hover:text-neutral-ink group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
              <Link
                to="/docs/authenticate-face"
                className="group flex items-center justify-between p-4 rounded-xl border border-neutral-line bg-neutral-surface hover:bg-neutral-line transition-colors"
              >
                <div>

                  <p className="text-sm font-semibold text-neutral-ink">Authenticate Face</p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-muted group-hover:text-neutral-ink group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            </div>
          </div>
        </section>

      </article>
      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#quickstart" />
      </div>
    </div>
  )
}
