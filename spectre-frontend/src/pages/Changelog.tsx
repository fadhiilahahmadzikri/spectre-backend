const entries = [
  {
    version: 'v1.0.0',
    date: 'Juni 2026',
    tag: 'Initial Release',
    changes: [
      { type: 'new', text: 'POST /api/v1/faces/register — daftarkan wajah user dengan face embedding terenkripsi.' },
      { type: 'new', text: 'POST /api/v1/faces/authenticate — verifikasi wajah dengan liveness detection dan anti-spoof (FAS) dalam satu call.' },
      { type: 'new', text: 'POST /api/v1/faces/replace — ganti template biometrik yang sudah ada.' },
      { type: 'new', text: 'DELETE /api/v1/faces/{external_user_id} — hapus face profile user secara permanen.' },
      { type: 'new', text: 'GET /api/v1/faces/{external_user_id}/exists — cek apakah user sudah memiliki face profile.' },
      { type: 'new', text: 'POST /api/v1/applications — manajemen aplikasi dan API key via dashboard.' },
      { type: 'new', text: 'API key format spk_... per-aplikasi dengan revoke dan delete dari dashboard.' },
      { type: 'new', text: '@thewhitenigs/spectre-snap — SDK React dengan komponen SpectreAuthModal dan SpectreAuth.' },
      { type: 'new', text: 'mode="auto" — SDK otomatis deteksi register vs authenticate berdasarkan face profile yang ada.' },
      { type: 'new', text: 'Anti-spoof (FAS) pasif — blokir foto cetak, video replay, 3D mask, dan deepfake.' },
      { type: 'new', text: 'Liveness detection pasif — tidak perlu kedip atau gerakkan kepala.' },
      { type: 'new', text: 'Face embedding dienkripsi di server — gambar asli tidak pernah disimpan.' },
      { type: 'new', text: 'Rate limiting per API key dengan error code RATE_LIMIT_EXCEEDED.' },
    ],
  },
]

const typeStyles: Record<string, string> = {
  new:      'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400',
  fix:      'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400',
  improved: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400',
  breaking: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400',
}

export default function Changelog() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="mb-10">
        <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Docs</span>
        <h1 className="text-3xl font-bold text-neutral-ink mt-3 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
          Changelog
        </h1>
        <p className="text-base text-neutral-slate">
          Semua perubahan pada Spectre API dan SDK dicatat di sini.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {entries.map((entry) => (
          <div key={entry.version} className="flex gap-5">
            {/* Timeline */}
            <div className="flex flex-col items-center gap-2 pt-1 flex-shrink-0">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-neutral-ink mt-1" />
              <div className="flex-1 w-px bg-neutral-line" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <h2 className="text-xl font-bold text-neutral-ink">{entry.version}</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-surface text-neutral-charcoal border border-neutral-line">
                  {entry.tag}
                </span>
                <span className="text-sm text-neutral-muted">{entry.date}</span>
              </div>

              <div className="bg-neutral-white border border-neutral-line rounded-xl overflow-hidden">
                {entry.changes.map((change, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-4 py-2.5 ${i < entry.changes.length - 1 ? 'border-b border-neutral-line' : ''}`}
                  >
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 ${typeStyles[change.type] ?? 'bg-neutral-surface text-neutral-charcoal'}`}>
                      {change.type}
                    </span>
                    <p className="text-sm text-neutral-charcoal leading-relaxed">{change.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
