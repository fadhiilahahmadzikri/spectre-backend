import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  Asterisk,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  ShieldCheck,
  Webhook,
  XCircle,
} from 'lucide-react'
import {
  SpectreAuthModal,
  type SpectreAuthResult,
  type SpectreFailureReason,
} from '@thewhitenigs/spectre-snap'

type Namespace = 'product' | 'lab'
type ProductScreen = 'login' | 'dashboard'
type VerificationState = 'idle' | 'ready' | 'verified' | 'failed'
type ReceiverState = 'checking' | 'online' | 'offline'

interface SdkAttempt {
  state: VerificationState
  userId: string
  result?: SpectreAuthResult
  failureReason?: SpectreFailureReason
  receivedAt?: string
}

interface WebhookEvent {
  id: string
  receivedAt: string
  signature: string | null
  signatureStatus: 'valid' | 'invalid' | 'missing' | 'not_configured'
  payload: {
    event?: string
    session_id?: string
    app_id?: string
    external_user_id?: string
    status?: string
    liveness_class?: string | null
    liveness_confidence?: number | null
    similarity_score?: number | null
    inference_time_ms?: number | null
    timestamp?: string
    [key: string]: unknown
  }
}

interface WebhookInboxResponse {
  events: WebhookEvent[]
  configuredSecret: boolean
}

const DEFAULT_RECEIVER_URL = 'http://localhost:8787'
const receiverUrl = import.meta.env.VITE_WEBHOOK_RECEIVER_URL || DEFAULT_RECEIVER_URL
const spectreApiKey = import.meta.env.VITE_SPECTRE_API_KEY

function resolveNamespace(): Namespace {
  return window.location.hash === '#/lab' ? 'lab' : 'product'
}

function formatPercent(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return `${Math.round(value * 100)}%`
}

function formatMilliseconds(value?: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-'
  return `${Math.round(value)} ms`
}

function formatDate(value?: string | null): string {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function statusTone(state: VerificationState): string {
  if (state === 'verified') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (state === 'failed') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (state === 'ready') return 'border-sky-200 bg-sky-50 text-sky-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function receiverTone(state: ReceiverState): string {
  if (state === 'online') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (state === 'offline') return 'border-rose-200 bg-rose-50 text-rose-800'
  return 'border-amber-200 bg-amber-50 text-amber-800'
}

function signatureTone(status: WebhookEvent['signatureStatus']): string {
  if (status === 'valid') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'invalid') return 'border-rose-200 bg-rose-50 text-rose-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function getEventLabel(event?: string): string {
  return event || 'webhook.received'
}

function App() {
  const [namespace, setNamespace] = useState<Namespace>(resolveNamespace)
  const [screen, setScreen] = useState<ProductScreen>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSpectreOpen, setIsSpectreOpen] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [sdkAttempt, setSdkAttempt] = useState<SdkAttempt>({ state: 'idle', userId: '' })
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([])
  const [receiverState, setReceiverState] = useState<ReceiverState>('checking')
  const [receiverSecretConfigured, setReceiverSecretConfigured] = useState(false)
  const [lastInboxRefresh, setLastInboxRefresh] = useState<string | null>(null)

  const trimmedEmail = email.trim()
  const latestWebhook = webhookEvents[0]
  const matchingWebhook = useMemo(() => {
    const sessionId = sdkAttempt.result?.sessionId
    if (!sessionId) return null
    return webhookEvents.find((event) => event.payload.session_id === sessionId) ?? null
  }, [sdkAttempt.result?.sessionId, webhookEvents])

  useEffect(() => {
    function handleHashChange() {
      setNamespace(resolveNamespace())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  async function refreshWebhookInbox() {
    setReceiverState((current) => (current === 'offline' ? 'checking' : current))

    try {
      const response = await fetch(`${receiverUrl}/events`, { cache: 'no-store' })
      if (!response.ok) throw new Error(`receiver_status_${response.status}`)

      const inbox = (await response.json()) as WebhookInboxResponse
      setWebhookEvents(inbox.events)
      setReceiverSecretConfigured(inbox.configuredSecret)
      setReceiverState('online')
      setLastInboxRefresh(new Date().toISOString())
    } catch {
      setReceiverState('offline')
    }
  }

  async function clearWebhookInbox() {
    try {
      await fetch(`${receiverUrl}/events`, { method: 'DELETE' })
      setWebhookEvents([])
      setReceiverState('online')
      setLastInboxRefresh(new Date().toISOString())
    } catch {
      setReceiverState('offline')
    }
  }

  useEffect(() => {
    refreshWebhookInbox()
    const timer = window.setInterval(refreshWebhookInbox, 2500)
    return () => window.clearInterval(timer)
  }, [])

  function openSpectre() {
    if (!trimmedEmail) {
      setFormMessage('Email harus diisi dulu.')
      return
    }

    if (!spectreApiKey) {
      setFormMessage('VITE_SPECTRE_API_KEY belum terisi.')
      return
    }

    setFormMessage('')
    setSdkAttempt({ state: 'idle', userId: trimmedEmail })
    setIsSpectreOpen(true)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    openSpectre()
  }

  function handleSuccess(result: SpectreAuthResult) {
    setSdkAttempt({
      state: 'verified',
      userId: trimmedEmail,
      result,
      receivedAt: new Date().toISOString(),
    })
    setIsSpectreOpen(false)
    setScreen('dashboard')
  }

  function handleFailed(reason: SpectreFailureReason, result?: SpectreAuthResult) {
    setSdkAttempt({
      state: 'failed',
      userId: trimmedEmail,
      result,
      failureReason: reason,
      receivedAt: new Date().toISOString(),
    })
    setFormMessage(`Spectre failed: ${reason}`)
  }

  function handleReady() {
    setSdkAttempt({ state: 'ready', userId: trimmedEmail, receivedAt: new Date().toISOString() })
  }

  function goToLab() {
    window.location.hash = '#/lab'
  }

  function goToProduct() {
    window.location.hash = '#/'
  }

  return (
    <>
      {namespace === 'lab' ? (
        <WebhookLabNamespace
          sdkAttempt={sdkAttempt}
          receiverState={receiverState}
          receiverSecretConfigured={receiverSecretConfigured}
          webhookEvents={webhookEvents}
          latestWebhook={latestWebhook}
          matchingWebhook={matchingWebhook}
          lastInboxRefresh={lastInboxRefresh}
          onBackToProduct={goToProduct}
          onRefreshInbox={refreshWebhookInbox}
          onClearInbox={clearWebhookInbox}
        />
      ) : screen === 'dashboard' ? (
        <ProductDashboard
          email={trimmedEmail}
          sdkAttempt={sdkAttempt}
          matchingWebhook={matchingWebhook}
          latestWebhook={latestWebhook}
          receiverState={receiverState}
          onScanAgain={openSpectre}
          onOpenLab={goToLab}
        />
      ) : (
        <ProductLogin
          email={email}
          password={password}
          showPassword={showPassword}
          formMessage={formMessage}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword((current) => !current)}
          onSubmit={handleSubmit}
          onOpenSpectre={openSpectre}
          onOpenLab={goToLab}
        />
      )}

      <SpectreAuthModal
        open={isSpectreOpen}
        onOpenChange={setIsSpectreOpen}
        userId={trimmedEmail}
        mode="auto"
        onReady={handleReady}
        onSuccess={handleSuccess}
        onFailed={handleFailed}
      />
    </>
  )
}

interface ProductLoginProps {
  email: string
  password: string
  showPassword: boolean
  formMessage: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onTogglePassword: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onOpenSpectre: () => void
  onOpenLab: () => void
}

function ProductLogin({
  email,
  password,
  showPassword,
  formMessage,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onOpenSpectre,
  onOpenLab,
}: ProductLoginProps) {
  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-[2rem] shadow-sm w-full max-w-[1000px] grid grid-cols-1 md:grid-cols-2 p-3 overflow-hidden">
        <GradientPanel className="relative w-full rounded-[1.5rem] p-8 md:p-10 flex flex-col justify-between overflow-hidden min-h-[500px]">
          <div className="relative z-10 text-white">
            <Asterisk className="w-10 h-10 stroke-[3]" />
          </div>

          <div className="relative z-10 text-white mt-auto">
            <p className="text-sm font-medium mb-3 opacity-90">You can easily</p>
            <h1 className="text-3xl md:text-[2.5rem] font-bold leading-[1.1] tracking-tight">
              Get access your personal hub for clarity and productivity
            </h1>
          </div>
        </GradientPanel>

        <div className="w-full p-8 md:px-14 md:py-12 flex flex-col justify-center">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Asterisk className="w-8 h-8 text-[#4338ca] stroke-[3]" />
            <button
              type="button"
              onClick={onOpenLab}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:border-[#4338ca]/30 hover:text-[#4338ca]"
            >
              Lab
            </button>
          </div>

          <h2 className="text-[2rem] font-bold text-gray-900 mb-3 tracking-tight">Create an account</h2>

          <p className="text-[#6b7280] text-sm mb-8 leading-relaxed pr-4">
            Access your tasks, notes, and projects anytime, anywhere - and keep everything flowing in one place.
          </p>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-900">
                Your email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="farazhaidet786@gmail.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca]/20 focus:border-[#4338ca] transition-all text-sm text-gray-900 placeholder-gray-400 font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-900">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338ca]/20 focus:border-[#4338ca] transition-all text-sm text-gray-900 placeholder-gray-400 tracking-widest font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {formMessage && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                {formMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] text-sm"
            >
              Get Started
            </button>
          </form>

          <div className="mt-8 relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative bg-white px-4 text-xs text-gray-400 font-medium">
              or continue with
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onOpenSpectre}
              className="flex-1 flex items-center justify-center py-2.5 bg-[#f3f4f6] hover:bg-gray-200 rounded-lg transition-colors"
            >
              <img src="/logo.svg" alt="Spectre" className="w-5 h-5" />
            </button>
            <button type="button" className="flex-1 flex items-center justify-center py-2.5 bg-[#f3f4f6] hover:bg-gray-200 rounded-lg transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </button>
            <button type="button" className="flex-1 flex items-center justify-center py-2.5 bg-[#f3f4f6] hover:bg-gray-200 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-500 font-medium">
            Don't have an account? <a href="#" className="text-[#4f46e5] hover:underline font-semibold">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  )
}

interface ProductDashboardProps {
  email: string
  sdkAttempt: SdkAttempt
  matchingWebhook: WebhookEvent | null
  latestWebhook?: WebhookEvent
  receiverState: ReceiverState
  onScanAgain: () => void
  onOpenLab: () => void
}

function ProductDashboard({
  email,
  sdkAttempt,
  matchingWebhook,
  latestWebhook,
  receiverState,
  onScanAgain,
  onOpenLab,
}: ProductDashboardProps) {
  const backendConfirmed = Boolean(matchingWebhook)
  const event = matchingWebhook ?? latestWebhook

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-4 font-sans text-gray-950">
      <div className="mx-auto max-w-[1100px]">
        <header className="mb-4 flex flex-col gap-3 rounded-[1.5rem] bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Spectre" className="h-9 w-9" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f46e5]">Spectre</p>
              <h1 className="text-xl font-bold tracking-tight text-gray-950">Personal Hub</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onScanAgain}
              className="rounded-xl bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.25)] transition hover:bg-[#4338ca]"
            >
              Verify again
            </button>
            <button
              type="button"
              onClick={onOpenLab}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#4f46e5]/30 hover:text-[#4f46e5]"
            >
              Lab
            </button>
          </div>
        </header>

        <main className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <GradientPanel className="relative min-h-[360px] overflow-hidden rounded-[1.5rem] p-8 text-white shadow-sm">
            <div className="relative z-10 flex h-full min-h-[300px] flex-col justify-between">
              <div className="flex items-center justify-between">
                <Asterisk className="h-10 w-10 stroke-[3]" />
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {backendConfirmed ? 'Backend confirmed' : 'Pending backend'}
                </span>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium opacity-90">{email}</p>
                <h2 className="max-w-[640px] text-3xl font-bold leading-[1.08] tracking-tight md:text-[2.6rem]">
                  Identity verified. Your workspace is ready.
                </h2>
              </div>
            </div>
          </GradientPanel>

          <section className="grid gap-4">
            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Identity status</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    {sdkAttempt.result?.label ?? 'Verified'}
                  </h2>
                </div>
                <CheckCircle2 className="text-emerald-500" size={28} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SoftMetric label="Session" value={sdkAttempt.result?.sessionId ?? '-'} mono />
                <SoftMetric label="Verdict" value={sdkAttempt.result?.verdict ?? '-'} />
                <SoftMetric label="Live" value={formatPercent(sdkAttempt.result?.summary.live)} />
                <SoftMetric label="Similarity" value={formatPercent(sdkAttempt.result?.similarityScore)} />
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Backend confirmation</p>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight">
                    {backendConfirmed ? 'Persisted' : 'Waiting'}
                  </h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${backendConfirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                  {receiverState}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SoftMetric label="Event" value={getEventLabel(event?.payload.event)} />
                <SoftMetric label="Status" value={event?.payload.status ?? '-'} />
                <SoftMetric label="Signature" value={event?.signatureStatus ?? 'waiting'} />
                <SoftMetric label="Received" value={formatDate(event?.receivedAt)} />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

interface WebhookLabNamespaceProps {
  sdkAttempt: SdkAttempt
  receiverState: ReceiverState
  receiverSecretConfigured: boolean
  webhookEvents: WebhookEvent[]
  latestWebhook?: WebhookEvent
  matchingWebhook: WebhookEvent | null
  lastInboxRefresh: string | null
  onBackToProduct: () => void
  onRefreshInbox: () => void
  onClearInbox: () => void
}

function WebhookLabNamespace({
  sdkAttempt,
  receiverState,
  receiverSecretConfigured,
  webhookEvents,
  latestWebhook,
  matchingWebhook,
  lastInboxRefresh,
  onBackToProduct,
  onRefreshInbox,
  onClearInbox,
}: WebhookLabNamespaceProps) {
  return (
    <div className="min-h-screen bg-[#eef2f3] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Spectre" className="h-9 w-9" />
            <div>
              <p className="text-sm font-semibold text-slate-500">Spectre Snap Lab</p>
              <h1 className="text-xl font-semibold tracking-normal text-slate-950">
                Webhook Acceptance
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={onBackToProduct}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 transition hover:bg-slate-50"
            >
              Product
            </button>
            <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 ${statusTone(sdkAttempt.state)}`}>
              <ShieldCheck size={14} />
              SDK {sdkAttempt.state}
            </span>
            <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 ${receiverTone(receiverState)}`}>
              <Server size={14} />
              Receiver {receiverState}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-5 py-5 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">SDK Callback</h2>
              <p className="mt-1 text-sm text-slate-500">Browser result</p>
            </div>
            {sdkAttempt.state === 'verified' ? (
              <CheckCircle2 className="text-emerald-600" size={24} />
            ) : sdkAttempt.state === 'failed' ? (
              <XCircle className="text-rose-600" size={24} />
            ) : (
              <Activity className="text-slate-500" size={24} />
            )}
          </div>

          <div className={`mb-5 rounded-md border px-3 py-2 text-sm font-semibold ${statusTone(sdkAttempt.state)}`}>
            {sdkAttempt.state === 'idle' && 'No scan result yet'}
            {sdkAttempt.state === 'ready' && 'Camera ready'}
            {sdkAttempt.state === 'verified' && 'Verified by SDK callback'}
            {sdkAttempt.state === 'failed' && `Failed: ${sdkAttempt.failureReason ?? 'unknown'}`}
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Metric label="User" value={sdkAttempt.userId || '-'} />
            <Metric label="Session" value={sdkAttempt.result?.sessionId ?? '-'} mono />
            <Metric label="Verdict" value={sdkAttempt.result?.verdict ?? '-'} />
            <Metric label="Label" value={sdkAttempt.result?.label ?? '-'} />
            <Metric label="Live" value={formatPercent(sdkAttempt.result?.summary.live)} />
            <Metric label="Spoof" value={formatPercent(sdkAttempt.result?.summary.spoof)} />
            <Metric label="Similarity" value={formatPercent(sdkAttempt.result?.similarityScore)} />
            <Metric label="Inference" value={formatMilliseconds(sdkAttempt.result?.inferenceTimeMs)} />
          </dl>

          <JsonBlock data={sdkAttempt.result ?? { state: sdkAttempt.state }} />
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-normal">Webhook Inbox</h2>
              <p className="mt-1 text-sm text-slate-500">Consumer server result</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefreshInbox}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50"
                aria-label="Refresh webhook inbox"
              >
                <RefreshCw size={17} />
              </button>
              <button
                type="button"
                onClick={onClearInbox}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50"
                aria-label="Clear webhook inbox"
              >
                <Database size={17} />
              </button>
            </div>
          </div>

          <div className={`mb-5 rounded-md border px-3 py-2 text-sm font-semibold ${receiverTone(receiverState)}`}>
            {receiverState === 'checking' && 'Checking receiver'}
            {receiverState === 'online' && `${webhookEvents.length} event(s) received`}
            {receiverState === 'offline' && 'Receiver offline'}
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Metric label="Latest event" value={getEventLabel(latestWebhook?.payload.event)} />
            <Metric label="Matched session" value={matchingWebhook ? 'yes' : 'not yet'} />
            <Metric label="Signature" value={latestWebhook?.signatureStatus ?? (receiverSecretConfigured ? 'waiting' : 'not_configured')} />
            <Metric label="Last refresh" value={formatDate(lastInboxRefresh)} />
          </dl>

          <div className="mt-5 space-y-3">
            {webhookEvents.length === 0 ? (
              <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-medium text-slate-500">
                Waiting for Spectre webhook POST
              </div>
            ) : (
              webhookEvents.slice(0, 4).map((event) => (
                <WebhookEventRow key={event.id} event={event} matched={event.id === matchingWebhook?.id} />
              ))
            )}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Webhook size={20} className="text-cyan-700" />
            <h2 className="text-lg font-semibold tracking-normal">Server Decision</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <DecisionStep
              title="1. Browser UX"
              value={sdkAttempt.result?.verdict ?? sdkAttempt.state}
              detail={sdkAttempt.result?.sessionId ?? 'SDK callback belum punya session'}
            />
            <DecisionStep
              title="2. Consumer Backend"
              value={matchingWebhook ? getEventLabel(matchingWebhook.payload.event) : 'waiting'}
              detail={matchingWebhook?.payload.status ?? 'Belum ada event yang cocok'}
            />
            <DecisionStep
              title="3. Database Update"
              value={matchingWebhook ? 'safe to persist' : 'do not persist yet'}
              detail={matchingWebhook ? `signature: ${matchingWebhook.signatureStatus}` : 'Menunggu server-to-server callback'}
            />
          </div>
        </article>
      </main>
    </div>
  )
}

interface GradientPanelProps {
  children: ReactNode
  className: string
}

function GradientPanel({ children, className }: GradientPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useAnimatedGradient(canvasRef)

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      {children}
    </div>
  )
}

function useAnimatedGradient(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    if (!gl) return

    const vsSource = `
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `

    const fsSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;

        float t = u_time * 0.3;

        vec3 noisePos = vec3(p.x * 1.5, p.y * 1.5, t * 0.5);
        float n1 = snoise(noisePos);
        float n2 = snoise(noisePos + vec3(2.0, -1.0, t * 0.2));

        vec3 bg = vec3(0.96, 0.96, 0.98);
        vec3 pink = vec3(0.95, 0.3, 0.6);
        vec3 blue = vec3(0.1, 0.3, 0.9);

        float d = length(p + vec2(n1 * 0.2, n2 * 0.3));

        vec3 col = bg;

        float pinkMix = smoothstep(1.0, -0.2, d + n1 * 0.5 - p.x * 0.5);
        float blueMix = smoothstep(1.1, -0.1, d + n2 * 0.5 + p.y * 0.5 + p.x * 0.2);

        col = mix(col, pink, pinkMix * 0.7);
        col = mix(col, blue, blueMix * 0.8);

        vec2 grainCoord = floor(gl_FragCoord.xy * 0.5);
        float grain = random(grainCoord + fract(u_time));
        col += (grain - 0.5) * 0.08;

        gl_FragColor = vec4(col, 1.0);
      }
    `

    const loadShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource)
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource)
    const program = gl.createProgram()

    if (!program || !vertexShader || !fragmentShader) return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      1.0, 1.0,
    ]), gl.STATIC_DRAW)

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(positionAttributeLocation)
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')

    let animationFrameId: number
    let lastTime = 0
    let dynamicTime = 0

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        let width: number
        let height: number

        if (entry.devicePixelContentBoxSize) {
          width = entry.devicePixelContentBoxSize[0].inlineSize
          height = entry.devicePixelContentBoxSize[0].blockSize
        } else if (entry.contentBoxSize) {
          width = Math.floor(entry.contentBoxSize[0].inlineSize)
          height = Math.floor(entry.contentBoxSize[0].blockSize)
        } else {
          width = Math.floor(entry.contentRect.width)
          height = Math.floor(entry.contentRect.height)
        }

        if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
          canvas.width = width
          canvas.height = height
          gl.viewport(0, 0, width, height)
          gl.uniform2f(resolutionLocation, width, height)
        }
      }
    })

    try {
      resizeObserver.observe(canvas, { box: 'device-pixel-content-box' })
    } catch {
      resizeObserver.observe(canvas, { box: 'content-box' })
    }

    const render = (time: number) => {
      const deltaTime = (time - lastTime) * 0.001 || 0.016
      lastTime = time
      dynamicTime += deltaTime

      gl.uniform1f(timeLocation, dynamicTime)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationFrameId)
      gl.deleteProgram(program)
      if (vertexShader) gl.deleteShader(vertexShader)
      if (fragmentShader) gl.deleteShader(fragmentShader)
      if (positionBuffer) gl.deleteBuffer(positionBuffer)
    }
  }, [canvasRef])
}

interface SoftMetricProps {
  label: string
  value: string
  mono?: boolean
}

function SoftMetric({ label, value, mono = false }: SoftMetricProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">{label}</p>
      <p className={`mt-1 break-words text-sm font-bold text-gray-950 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </p>
    </div>
  )
}

interface MetricProps {
  label: string
  value: string
  mono?: boolean
}

function Metric({ label, value, mono = false }: MetricProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className={`mt-1 break-words text-sm font-semibold text-slate-950 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </dd>
    </div>
  )
}

interface WebhookEventRowProps {
  event: WebhookEvent
  matched: boolean
}

function WebhookEventRow({ event, matched }: WebhookEventRowProps) {
  return (
    <div className={`rounded-md border p-3 ${matched ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{getEventLabel(event.payload.event)}</p>
          <p className="mt-1 font-mono text-xs text-slate-500">{event.payload.session_id ?? 'no-session'}</p>
        </div>
        <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${signatureTone(event.signatureStatus)}`}>
          {event.signatureStatus}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
        <span>{event.payload.external_user_id ?? '-'}</span>
        <span>{event.payload.status ?? '-'}</span>
        <span>{formatDate(event.receivedAt)}</span>
      </div>
    </div>
  )
}

interface DecisionStepProps {
  title: string
  value: string
  detail: string
}

function DecisionStep({ title, value, detail }: DecisionStepProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-slate-500">
        <Clock size={16} />
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="text-base font-semibold text-slate-950">{value}</p>
      <p className="mt-1 break-words font-mono text-xs text-slate-500">{detail}</p>
    </div>
  )
}

interface JsonBlockProps {
  data: unknown
}

function JsonBlock({ data }: JsonBlockProps) {
  return (
    <pre className="mt-5 max-h-60 overflow-auto rounded-md border border-slate-200 bg-slate-950 p-3 text-xs leading-relaxed text-slate-100">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

export default App
