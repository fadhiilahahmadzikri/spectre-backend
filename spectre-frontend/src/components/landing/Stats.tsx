const stats = [
  { value: '<120ms', label: 'P95 Latency' },
  { value: '0.001%', label: 'False Accept Rate' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '24h', label: 'Session Retention' },
]

export default function Stats() {
  return (
    <section className="bg-neutral-canvas py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-neutral-ink mb-1 font-['Plus_Jakarta_Sans',sans-serif]">
                {stat.value}
              </p>
              <p className="text-sm text-neutral-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
