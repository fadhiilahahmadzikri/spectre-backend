import { ArrowRight } from 'lucide-react'
import TableOfContents from '@/components/docs/TableOfContents'

const tocItems = [
  { label: 'Introduction', href: '#introduction', level: 1 as const },
  { label: 'Cara Kerja', href: '#how-it-works', level: 2 as const },
]

const steps = [
  { n: '1', title: 'Buat aplikasi & API key', desc: 'Login → Applications → New application → Generate key.' },
  { n: '2', title: 'Install SDK', desc: 'npm install @thewhitenigs/spectre-snap' },
  { n: '3', title: 'Tambah SpectreAuthModal', desc: 'Pasang komponen React ke aplikasi, isi apiKey dan userId.' },
  { n: '4', title: 'Terima hasil', desc: 'onSuccess dipanggil dengan verdict dan session ID.' },
]

export default function Introduction() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">

        <div id="introduction" className="mb-8">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Getting Started</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Introduction
          </h1>
          <p className="text-sm sm:text-base text-neutral-slate leading-relaxed">
            Spectre adalah platform autentikasi wajah. Tambahkan verifikasi biometrik ke aplikasi
            apa pun lewat SDK React atau REST API — lengkap dengan liveness detection dan anti-spoof.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-8 sm:mb-10 text-center">
          {[
            { v: '<120ms', l: 'Latensi' },
            { v: '0.001%', l: 'False Accept' },
            { v: '99.9%', l: 'Uptime' },
          ].map(s => (
            <div key={s.l} className="bg-neutral-surface rounded-xl p-3 sm:p-4 border border-neutral-line">
              <p className="text-lg sm:text-2xl font-bold text-neutral-ink mb-0.5">{s.v}</p>
              <p className="text-[10px] sm:text-xs text-neutral-muted">{s.l}</p>
            </div>
          ))}
        </div>

        <div id="how-it-works" className="mb-10">
          <h2 className="text-xl font-bold text-neutral-ink mb-4">Cara Kerja</h2>
          <div className="flex flex-col gap-2.5">
            {steps.map(s => (
              <div key={s.n} className="flex gap-3 p-3.5 bg-neutral-white border border-neutral-line rounded-xl">
                <div className="w-6 h-6 rounded-full bg-neutral-ink dark:bg-neutral-surface dark:border dark:border-neutral-charcoal flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[11px] font-bold text-white dark:text-neutral-ink">{s.n}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-ink">{s.title}</p>
                  <p className="text-xs text-neutral-muted mt-0.5 break-all">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <a href="/docs/quickstart"
          className="flex items-center justify-between p-5 bg-neutral-ink dark:bg-neutral-surface dark:border dark:border-neutral-charcoal rounded-xl text-white dark:text-neutral-ink hover:bg-neutral-charcoal dark:hover:bg-neutral-surface transition-colors">
          <div>
            <p className="font-semibold">Mulai sekarang</p>
            <p className="text-sm text-white/60 dark:text-neutral-muted mt-0.5">Ikuti Quickstart — selesai dalam 5 menit</p>
          </div>
          <ArrowRight className="w-4 h-4 text-white/60 dark:text-neutral-muted flex-shrink-0" />
        </a>

      </article>
      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#introduction" />
      </div>
    </div>
  )
}
