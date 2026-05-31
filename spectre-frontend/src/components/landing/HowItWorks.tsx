import { Code2, UserPlus, ScanFace, Webhook } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Code2,
    title: 'Integrate SDK',
    description:
      'Add Specter to your project with a single npm install or script tag. Initialize with your publishable API key — no backend changes needed to get started.',
    code: 'npm install @faceguard/js',
  },
  {
    number: '02',
    icon: UserPlus,
    title: 'Register Face',
    description:
      'Call the registration API with the user\'s image and your external user ID. Specter securely processes and stores an encrypted biometric template.',
    code: 'POST /v1/faces/register',
  },
  {
    number: '03',
    icon: ScanFace,
    title: 'Authenticate',
    description:
      'Launch the Specter popup to capture a live selfie. Liveness detection and anti-spoofing checks run automatically before comparison.',
    code: 'POST /v1/faces/authenticate',
  },
  {
    number: '04',
    icon: Webhook,
    title: 'Receive Webhook',
    description:
      'Get an instant webhook payload with the authentication result, session ID, confidence score, and match status. React in your backend within milliseconds.',
    code: 'event: face.authenticated',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 bg-neutral-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-neutral-muted uppercase tracking-wider mb-3">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-normal text-neutral-ink mb-4 font-serif">
            Up and running in four steps
          </h2>
          <p className="text-lg text-neutral-charcoal max-w-2xl mx-auto">
            From zero to authenticated users in under 10 minutes. No biometrics expertise required.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ number, icon: Icon, title, description, code }, i) => (
            <div key={number} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-neutral-line to-transparent z-0" />
              )}
              <div className="relative bg-white border border-neutral-line rounded-xl p-6 hover:shadow-card-hover transition-shadow">
                {/* Number + icon */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-bold text-neutral-line font-['Plus_Jakarta_Sans',sans-serif]">
                    {number}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-neutral-surface flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-neutral-ink" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-neutral-ink mb-2">{title}</h3>
                <p className="text-sm text-neutral-charcoal leading-relaxed mb-4">{description}</p>
                {/* Code hint */}
                <code className="block text-[12px] font-mono text-neutral-slate bg-neutral-surface rounded px-2.5 py-1.5">
                  {code}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
