import CodeBlock from '@/components/docs/CodeBlock'

const installCode = `npm install @thewhitenigs/spectre-snap`

const modalExample = `import { useState } from "react";
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
        userId="user@email.com"
        mode="auto"
        onSuccess={(r: SpectreAuthResult) => {
          console.log(r.verdict, r.sessionId);
          setOpen(false);
        }}
        onFailed={(reason: SpectreFailureReason) => {
          // Biarkan modal terbuka — SDK tampilkan pesan error sendiri
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}`

const inlineExample = `import { SpectreAuth } from "@thewhitenigs/spectre-snap";

// Inline (tanpa modal) — scanner langsung tampil di dalam halaman
export default function VerifyPage() {
  return (
    <SpectreAuth
      apiKey={import.meta.env.VITE_SPECTRE_API_KEY}
      userId="user@email.com"
      mode="auto"
      onSuccess={(r) => console.log("ok", r.sessionId)}
      onFailed={(reason) => console.error(reason)}
    />
  );
}`

const propsTable = [
  { prop: 'apiKey', type: 'string', req: true,  desc: 'API key dari dashboard (format spk_...)' },
  { prop: 'userId', type: 'string', req: false, desc: 'ID unik user. Default: "anonymous"' },
  { prop: 'mode',   type: '"auto" | "register" | "authenticate"', req: false, desc: 'auto = deteksi otomatis. Default: "auto"' },
  { prop: 'fas',    type: 'boolean', req: false, desc: 'Aktifkan anti-spoofing. Default: true' },
  { prop: 'locale', type: '"id" | "en"', req: false, desc: 'Bahasa UI. Default: "id"' },
  { prop: 'theme',  type: '"dark" | "light"', req: false, desc: 'Tema tampilan. Default: "dark"' },
  { prop: 'redirectUrl', type: 'string', req: false, desc: 'URL redirect setelah authenticate berhasil' },
  { prop: 'onSuccess',   type: '(result) => void', req: false, desc: 'Dipanggil saat verifikasi berhasil' },
  { prop: 'onFailed',    type: '(reason) => void', req: false, desc: 'Dipanggil saat verifikasi gagal' },
  { prop: 'onClose',     type: '() => void',        req: false, desc: 'Dipanggil saat user menutup scanner' },
  { prop: 'onRedirect',  type: '() => void',        req: false, desc: 'Override redirect default setelah sukses' },
]

const verdicts = [
  { v: '"ok"',    color: 'text-green-600 bg-green-50',  desc: 'Identitas terverifikasi.' },
  { v: '"spoof"', color: 'text-red-600 bg-red-50',      desc: 'Serangan spoof terdeteksi.' },
  { v: '"warn"',  color: 'text-yellow-700 bg-yellow-50', desc: 'Wajah tidak cocok atau error lain.' },
]

export default function Sdks() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
      <div className="mb-8">
        <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Docs</span>
        <h1 className="text-3xl font-bold text-neutral-ink mt-3 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
          SDKs
        </h1>
        <p className="text-base text-neutral-slate">
          Spectre menyediakan SDK React siap pakai dengan komponen scanner kamera, liveness UI,
          dan semua logika verifikasi sudah terintegrasi.
        </p>
      </div>

      {/* Package info */}
      <div className="flex items-center justify-between p-4 bg-neutral-white border border-neutral-line rounded-xl mb-8">
        <div>
          <p className="text-sm font-semibold text-neutral-ink">@thewhitenigs/spectre-snap</p>
          <p className="text-xs text-neutral-muted mt-0.5">React SDK — komponen scanner wajah lengkap</p>
        </div>
        <span className="text-xs font-mono text-neutral-muted bg-neutral-surface px-2 py-1 rounded border border-neutral-line">
          npm
        </span>
      </div>

      {/* Install */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-neutral-ink mb-3">Instalasi</h2>
        <CodeBlock code={installCode} language="bash" />
      </section>

      {/* Modal */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-neutral-ink mb-1">SpectreAuthModal</h2>
        <p className="text-sm text-neutral-slate mb-3">
          Scanner muncul sebagai modal dialog — cara paling umum digunakan.
        </p>
        <CodeBlock code={modalExample} language="tsx" filename="App.tsx" />
      </section>

      {/* Inline */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-neutral-ink mb-1">SpectreAuth (inline)</h2>
        <p className="text-sm text-neutral-slate mb-3">
          Scanner langsung ditampilkan di dalam halaman tanpa modal.
        </p>
        <CodeBlock code={inlineExample} language="tsx" filename="VerifyPage.tsx" />
      </section>

      {/* Props */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-neutral-ink mb-3">Props</h2>
        <div className="border border-neutral-line rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-surface border-b border-neutral-line">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Prop</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Tipe</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {propsTable.map((p, i) => (
                <tr key={p.prop} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <code className="font-mono text-[12px] text-neutral-ink">{p.prop}</code>
                      {p.req && <span className="text-[10px] text-red-500 font-semibold">required</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5"><code className="font-mono text-[11px] text-neutral-muted">{p.type}</code></td>
                  <td className="px-4 py-2.5 text-[13px] text-neutral-slate">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Verdict */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-neutral-ink mb-3">Verdict</h2>
        <p className="text-sm text-neutral-slate mb-3">
          Field <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">result.verdict</code> di callback <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">onSuccess</code>:
        </p>
        <div className="border border-neutral-line rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-surface border-b border-neutral-line">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Verdict</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-neutral-muted uppercase tracking-wide">Keterangan</th>
              </tr>
            </thead>
            <tbody>
          {verdicts.map((v, i) => (
            <tr key={v.v} className={i % 2 === 0 ? 'bg-neutral-white' : 'bg-neutral-canvas'}>
              <td className="px-4 py-2.5"><code className={`font-mono text-[12px] font-semibold px-2 py-0.5 rounded ${v.color}`}>{v.v}</code></td>
              <td className="px-4 py-2.5 text-sm text-neutral-slate">{v.desc}</td>
            </tr>
          ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
