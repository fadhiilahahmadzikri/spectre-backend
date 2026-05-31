import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CodeBlock from '@/components/docs/CodeBlock'

const npmInstall = `npm install @faceguard/js`

const scriptTag = `<script src="https://cdn.faceguard.io/v0.1/faceguard.min.js"></script>`

const registerExample = `import { Specter } from '@faceguard/js'

const fg = new Specter('pk_live_xxxxxxxxxxxx')

// Register a user face
const result = await fg.register({
  externalUserId: 'user_abc123',
  onSuccess: (session) => {
    console.log('Registered:', session.session_id)
  },
  onError: (err) => {
    console.error('Error:', err.code, err.message)
  },
})`

const authenticateExample = `import { Specter } from '@faceguard/js'

const fg = new Specter('pk_live_xxxxxxxxxxxx')

// Launch the authentication popup
fg.authenticate({
  externalUserId: 'user_abc123',
  onResult: (result) => {
    if (result.match && result.liveness && !result.spoof_detected) {
      // Grant access
      grantAccess(result.session_id)
    } else {
      showError('Authentication failed')
    }
  },
  onError: (err) => {
    console.error(err.code) // e.g. CAMERA_DENIED, TIMEOUT
  },
})`

const reactExample = `import { SpecterButton } from '@faceguard/react'

export function LoginPage() {
  return (
    <SpecterButton
      publishableKey="pk_live_xxxxxxxxxxxx"
      externalUserId={currentUser.id}
      mode="authenticate"
      onResult={(result) => {
        if (result.match) redirectToDashboard()
      }}
      className="w-full"
    >
      Authenticate with Face
    </SpecterButton>
  )
}`

const sdks = [
  {
    name: 'JavaScript SDK',
    pkg: '@faceguard/js',
    version: '0.1.0',
    description: 'Universal JavaScript SDK. Works in any browser environment. Includes the pre-built popup UI and full TypeScript types.',
    badge: 'npm',
  },
  {
    name: 'React SDK',
    pkg: '@faceguard/react',
    version: '0.1.0',
    description: 'React hooks and components built on top of the JS SDK. Includes SpecterButton, useSpecter hook, and context provider.',
    badge: 'npm',
  },
]

export default function Sdks() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-neutral-canvas">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl font-bold text-neutral-ink mb-3 font-['Plus_Jakarta_Sans',sans-serif]">
            SDKs
          </h1>
          <p className="text-base text-neutral-slate mb-12 leading-relaxed max-w-2xl">
            Specter provides first-party SDKs for JavaScript and React. All SDKs are built on
            top of the REST API and include the pre-built popup camera UI.
          </p>

          {/* SDK cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-14">
            {sdks.map((sdk) => (
              <div key={sdk.pkg} className="bg-white border border-neutral-line rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-base font-semibold text-neutral-ink">{sdk.name}</p>
                  <span className="text-xs font-mono text-neutral-muted bg-neutral-surface px-2 py-0.5 rounded">
                    v{sdk.version}
                  </span>
                </div>
                <p className="text-xs text-neutral-charcoal leading-relaxed mb-4">{sdk.description}</p>
                <code className="text-[12px] font-mono text-[#240CF6] bg-[#240CF6]/5 px-2 py-1 rounded">
                  {sdk.pkg}
                </code>
              </div>
            ))}
          </div>

          {/* Installation */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-neutral-ink mb-4">Installation</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-charcoal mb-2">npm / yarn / pnpm</p>
                <CodeBlock code={npmInstall} language="bash" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-charcoal mb-2">CDN (script tag)</p>
                <CodeBlock code={scriptTag} language="html" />
              </div>
            </div>
          </section>

          {/* Register */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-neutral-ink mb-2">Register a Face</h2>
            <p className="text-sm text-neutral-slate mb-4">
              Launch the Specter popup to capture and register a user's face:
            </p>
            <CodeBlock code={registerExample} language="typescript" filename="register.ts" />
          </section>

          {/* Authenticate */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-neutral-ink mb-2">Authenticate</h2>
            <p className="text-sm text-neutral-slate mb-4">
              Launch the authentication popup and handle the result:
            </p>
            <CodeBlock code={authenticateExample} language="typescript" filename="authenticate.ts" />
          </section>

          {/* React */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-neutral-ink mb-2">React Component</h2>
            <p className="text-sm text-neutral-slate mb-4">
              Use the pre-built <code className="font-mono text-[13px] bg-neutral-surface px-1 rounded">SpecterButton</code>{' '}
              component for zero-configuration integration:
            </p>
            <CodeBlock code={reactExample} language="tsx" filename="LoginPage.tsx" />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
