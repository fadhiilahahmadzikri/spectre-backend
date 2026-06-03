import TableOfContents from '@/components/docs/TableOfContents'
import Callout from '@/components/docs/Callout'
import CodeBlock from '@/components/docs/CodeBlock'

const tocItems = [
  { label: 'Rate Limits', href: '#rate-limits', level: 1 as const },
]

const retryExample = `async function withRetry(fn: () => Promise<Response>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fn();
    if (res.status !== 429) return res;
    const wait = parseInt(res.headers.get('Retry-After') ?? '5', 10);
    await new Promise(r => setTimeout(r, wait * 1000));
  }
  throw new Error('Rate limit retries exhausted');
}`

export default function RateLimits() {
  return (
    <div className="flex gap-12 px-4 sm:px-8 py-6 sm:py-10 max-w-6xl">
      <article className="flex-1 min-w-0 max-w-3xl">

        <div className="mb-8">
          <span className="text-xs font-semibold text-neutral-muted uppercase tracking-wider">Getting Started</span>
          <h1 id="rate-limits" className="text-3xl font-bold text-neutral-ink mt-3 mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            Rate Limits
          </h1>
          <p className="text-base text-neutral-slate">
            Rate limit diterapkan per API key. Jika terlampaui, API mengembalikan{' '}
            <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">429</code> dengan
            error code <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">RATE_LIMIT_EXCEEDED</code>.
          </p>
        </div>

        <Callout variant="info" className="mb-6">
          Rate limit berlaku per API key — bukan per IP. Jika satu key dipakai di banyak tempat, semua berbagi quota yang sama.
        </Callout>

        <p className="text-sm font-semibold text-neutral-ink mb-3">Tangani error 429 dengan retry:</p>
        <CodeBlock code={retryExample} language="typescript" />

      </article>
      <div className="hidden xl:block pt-1">
        <TableOfContents items={tocItems} activeHref="#rate-limits" />
      </div>
    </div>
  )
}
