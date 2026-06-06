import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode, RefObject } from 'react'
import {
  Activity,
  Asterisk,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
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
type SessionLookupStatus = 'idle' | 'loading' | 'success' | 'error'

interface SdkAttempt {
  state: VerificationState
  userId: string
  result?: SpectreAuthResult
  failureReason?: SpectreFailureReason
  receivedAt?: string
}

interface SessionDetail {
  session_id: string
  session_type: string
  status: string
  external_user_id: string | null
  liveness_class: string | null
  liveness_confidence: number | null
  similarity_score: number | null
  inference_time_ms: number | null
  created_at: string | null
  completed_at: string | null
  diagnostics?: unknown
}

interface SessionLookup {
  status: SessionLookupStatus
  sessionId?: string
  data?: SessionDetail
  error?: string
  fetchedAt?: string
}

const DEFAULT_BASE_URL = 'https://thewhitenigs-spectre-backend.hf.space'
const DEFAULT_TEST_USER_ID = 'spectre-test-user'
const spectreBaseUrl = normalizeBaseUrl(import.meta.env.VITE_SPECTRE_BASE_URL || DEFAULT_BASE_URL)
const spectreApiKey = import.meta.env.VITE_SPECTRE_API_KEY || ''
const spectreTestUserId = import.meta.env.VITE_SPECTRE_TEST_USER_ID || DEFAULT_TEST_USER_ID

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_BASE_URL
  return trimmed.replace(/\/+$/, '')
}

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

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function statusTone(state: VerificationState): string {
  if (state === 'verified') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (state === 'failed') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (state === 'ready') return 'border-sky-200 bg-sky-50 text-sky-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function lookupTone(status: SessionLookupStatus): string {
  if (status === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'error') return 'border-rose-200 bg-rose-50 text-rose-800'
  if (status === 'loading') return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function lookupLabel(status: SessionLookupStatus): string {
  if (status === 'success') return 'confirmed'
  if (status === 'error') return 'failed'
  if (status === 'loading') return 'checking'
  return 'not started'
}

function getLookupError(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'session_lookup_failed'
}

async function fetchSessionDetails(sessionId: string): Promise<SessionDetail> {
  const response = await fetch(`${spectreBaseUrl}/api/v1/sessions/${sessionId}`, {
    headers: { 'X-API-Key': spectreApiKey },
    cache: 'no-store',
  })

  if (!response.ok) throw new Error(`session_lookup_${response.status}`)
  return response.json() as Promise<SessionDetail>
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
  const [sessionLookup, setSessionLookup] = useState<SessionLookup>({ status: 'idle' })

  const trimmedEmail = email.trim()
  const spectreUserId = trimmedEmail || spectreTestUserId
  const activeSessionId = sdkAttempt.result?.sessionId

  useEffect(() => {
    function handleHashChange() {
      setNamespace(resolveNamespace())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  async function confirmSession(sessionId: string) {
    if (!spectreApiKey) {
      setSessionLookup({
        status: 'error',
        sessionId,
        error: 'missing_api_key',
        fetchedAt: new Date().toISOString(),
      })
      return
    }

    setSessionLookup({ status: 'loading', sessionId })

    try {
      const detail = await fetchSessionDetails(sessionId)
      setSessionLookup({
        status: 'success',
        sessionId,
        data: detail,
        fetchedAt: new Date().toISOString(),
      })
    } catch (error) {
      setSessionLookup({
        status: 'error',
        sessionId,
        error: getLookupError(error),
        fetchedAt: new Date().toISOString(),
      })
    }
  }

  function openSpectre() {
    if (!spectreApiKey) {
      setFormMessage('VITE_SPECTRE_API_KEY is not configured.')
      return
    }

    setFormMessage('')
    setSessionLookup({ status: 'idle' })
    setSdkAttempt({ state: 'idle', userId: spectreUserId })
    setIsSpectreOpen(true)
  }

  function refreshActiveSession() {
    if (!activeSessionId) return
    void confirmSession(activeSessionId)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    openSpectre()
  }

  function handleSuccess(result: SpectreAuthResult) {
    setSdkAttempt({
      state: 'verified',
      userId: spectreUserId,
      result,
      receivedAt: new Date().toISOString(),
    })
    setIsSpectreOpen(false)
    setScreen('dashboard')

    if (result.sessionId) {
      setFormMessage('Spectre scan succeeded. Confirming session details.')
      void confirmSession(result.sessionId)
      return
    }

    setSessionLookup({
      status: 'error',
      error: 'missing_session_id',
      fetchedAt: new Date().toISOString(),
    })
    setFormMessage('Spectre scan succeeded, but the SDK did not return a session id.')
  }

  function handleFailed(reason: SpectreFailureReason, result?: SpectreAuthResult) {
    setSdkAttempt({
      state: 'failed',
      userId: spectreUserId,
      result,
      failureReason: reason,
      receivedAt: new Date().toISOString(),
    })
    setFormMessage(`Spectre failed: ${reason}`)
  }

  function handleReady() {
    setSdkAttempt({ state: 'ready', userId: spectreUserId, receivedAt: new Date().toISOString() })
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
        <SessionLabNamespace
          sdkAttempt={sdkAttempt}
          sessionLookup={sessionLookup}
          apiKeyConfigured={Boolean(spectreApiKey)}
          baseUrl={spectreBaseUrl}
          onBackToProduct={goToProduct}
          onRefreshSession={refreshActiveSession}
        />
      ) : screen === 'dashboard' ? (
        <ProductDashboard
          email={spectreUserId}
          sdkAttempt={sdkAttempt}
          sessionLookup={sessionLookup}
          onScanAgain={openSpectre}
          onOpenLab={goToLab}
          onRefreshSession={refreshActiveSession}
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
        apiKey={spectreApiKey}
        baseUrl={spectreBaseUrl}
        userId={spectreUserId}
        mode="auto"
        onReady={handleReady}
        onSuccess={handleSuccess}
        onFailed={handleFailed}
        onClose={() => setIsSpectreOpen(false)}
        onRedirect={() => setIsSpectreOpen(false)}
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
        <GradientPanel className="relative w-full rounded-[1.5rem] p-8 md:p-10 flex min-h-[500px] flex-col justify-between overflow-hidden">
          <div className="relative z-10 text-white">
            <Asterisk className="h-10 w-10 stroke-[3]" />
          </div>

          <div className="relative z-10 mt-auto text-white">
            <p className="mb-3 text-sm font-medium opacity-90">Personal workspace</p>
            <h1 className="text-3xl font-bold leading-[1.1] tracking-tight md:text-[2.5rem]">
              Sign in with a live face scan
            </h1>
          </div>
        </GradientPanel>

        <div className="flex w-full flex-col justify-center p-8 md:px-14 md:py-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Asterisk className="h-8 w-8 stroke-[3] text-[#4338ca]" />
            <button
              type="button"
              onClick={onOpenLab}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:border-[#4338ca]/30 hover:text-[#4338ca]"
            >
              Lab
            </button>
          </div>

          <h2 className="mb-3 text-[2rem] font-bold tracking-tight text-gray-900">Create an account</h2>

          <p className="mb-8 pr-4 text-sm leading-relaxed text-[#6b7280]">
            Access your tasks, notes, and projects anytime, anywhere - with Spectre protecting account access.
          </p>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-900">Your email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="farazhaidet786@gmail.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 transition-all placeholder-gray-400 focus:border-[#4338ca] focus:outline-none focus:ring-2 focus:ring-[#4338ca]/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-900">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="••••••••••"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium tracking-widest text-gray-900 transition-all placeholder-gray-400 focus:border-[#4338ca] focus:outline-none focus:ring-2 focus:ring-[#4338ca]/20"
                  required
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              className="w-full rounded-xl bg-[#4f46e5] py-3.5 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all hover:bg-[#4338ca] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)]"
            >
              Get Started
            </button>
          </form>

          <div className="relative mt-8 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative bg-white px-4 text-xs font-medium text-gray-400">
              or continue with
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onOpenSpectre}
              className="flex flex-1 items-center justify-center rounded-lg bg-[#f3f4f6] py-2.5 transition-colors hover:bg-gray-200"
              aria-label="Continue with Spectre"
            >
              <img src="/logo.svg" alt="Spectre" className="h-5 w-5" />
            </button>
            <button type="button" className="flex flex-1 items-center justify-center rounded-lg bg-[#f3f4f6] py-2.5 transition-colors hover:bg-gray-200">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </button>
            <button type="button" className="flex flex-1 items-center justify-center rounded-lg bg-[#f3f4f6] py-2.5 transition-colors hover:bg-gray-200">
              <svg className="h-5 w-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            Don't have an account? <a href="#" className="font-semibold text-[#4f46e5] hover:underline">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  )
}

interface ProductDashboardProps {
  email: string
  sdkAttempt: SdkAttempt
  sessionLookup: SessionLookup
  onScanAgain: () => void
  onOpenLab: () => void
  onRefreshSession: () => void
}

function ProductDashboard({
  email,
  sdkAttempt,
  sessionLookup,
  onScanAgain,
  onOpenLab,
  onRefreshSession,
}: ProductDashboardProps) {
  const backendConfirmed = sessionLookup.status === 'success'
  const detail = sessionLookup.data

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

        <main className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[1.5rem] bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-500">Welcome back</p>
                <h2 className="mt-1 break-words text-3xl font-bold tracking-tight">{email}</h2>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(sdkAttempt.state)}`}>
                <ShieldCheck size={14} />
                SDK {sdkAttempt.state}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <SoftMetric label="Session" value={sdkAttempt.result?.sessionId ?? '-'} mono />
              <SoftMetric label="Verdict" value={sdkAttempt.result?.verdict ?? '-'} />
              <SoftMetric label="Similarity" value={formatPercent(sdkAttempt.result?.similarityScore)} />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <DashboardTile title="Today" value="12 tasks" />
              <DashboardTile title="Focus" value="84%" />
              <DashboardTile title="Notes" value="37" />
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-500">Server confirmation</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">Session lookup</h2>
              </div>
              <button
                type="button"
                onClick={onRefreshSession}
                disabled={!sdkAttempt.result?.sessionId || sessionLookup.status === 'loading'}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Refresh session"
              >
                <RefreshCw size={17} />
              </button>
            </div>

            <div className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${lookupTone(sessionLookup.status)}`}>
              {backendConfirmed ? 'Server-confirmed session details are available.' : `Session lookup ${lookupLabel(sessionLookup.status)}.`}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <SoftMetric label="Status" value={detail?.status ?? lookupLabel(sessionLookup.status)} />
              <SoftMetric label="Type" value={detail?.session_type ?? '-'} />
              <SoftMetric label="Liveness" value={detail?.liveness_class ?? '-'} />
              <SoftMetric label="Completed" value={formatDate(detail?.completed_at)} />
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

interface DashboardTileProps {
  title: string
  value: string
}

function DashboardTile({ title, value }: DashboardTileProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
    </div>
  )
}

function getSessionDecisionDetail(sessionLookup: SessionLookup): string {
  if (sessionLookup.status === 'success') return `status: ${sessionLookup.data?.status ?? 'confirmed'}`
  if (sessionLookup.status === 'loading') return 'fetching server-confirmed session'
  if (sessionLookup.status === 'error') return sessionLookup.error ?? 'lookup failed'
  return 'waiting for SDK session id'
}

interface SessionLabNamespaceProps {
  sdkAttempt: SdkAttempt
  sessionLookup: SessionLookup
  apiKeyConfigured: boolean
  baseUrl: string
  onBackToProduct: () => void
  onRefreshSession: () => void
}

function SessionLabNamespace({
  sdkAttempt,
  sessionLookup,
  apiKeyConfigured,
  baseUrl,
  onBackToProduct,
  onRefreshSession,
}: SessionLabNamespaceProps) {
  const canRefresh = Boolean(sdkAttempt.result?.sessionId) && sessionLookup.status !== 'loading'

  return (
    <div className="min-h-screen bg-[#eef2f3] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Spectre" className="h-9 w-9" />
            <div>
              <p className="text-sm font-semibold text-slate-500">Spectre Snap Lab</p>
              <h1 className="text-xl font-semibold tracking-normal">Callback And Session Lookup</h1>
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
            <span className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 ${lookupTone(sessionLookup.status)}`}>
              <ClipboardCheck size={14} />
              Session {lookupLabel(sessionLookup.status)}
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
            {sdkAttempt.state === 'verified' && 'SDK success received'}
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
              <h2 className="text-lg font-semibold tracking-normal">Session Lookup</h2>
              <p className="mt-1 text-sm text-slate-500">{baseUrl}/api/v1/sessions/:sessionId</p>
            </div>
            <button
              type="button"
              onClick={onRefreshSession}
              disabled={!canRefresh}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Refresh session lookup"
            >
              <RefreshCw size={17} />
            </button>
          </div>

          <div className={`mb-5 rounded-md border px-3 py-2 text-sm font-semibold ${lookupTone(sessionLookup.status)}`}>
            {sessionLookup.status === 'idle' && 'Waiting for SDK session id'}
            {sessionLookup.status === 'loading' && 'Fetching session details'}
            {sessionLookup.status === 'success' && 'Server-confirmed session loaded'}
            {sessionLookup.status === 'error' && `Lookup failed: ${sessionLookup.error ?? 'unknown'}`}
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Metric label="API key" value={apiKeyConfigured ? 'configured' : 'missing'} />
            <Metric label="Status" value={sessionLookup.data?.status ?? lookupLabel(sessionLookup.status)} />
            <Metric label="External user" value={sessionLookup.data?.external_user_id ?? '-'} />
            <Metric label="Fetched" value={formatDate(sessionLookup.fetchedAt)} />
            <Metric label="Liveness" value={sessionLookup.data?.liveness_class ?? '-'} />
            <Metric label="Confidence" value={formatPercent(sessionLookup.data?.liveness_confidence)} />
            <Metric label="Similarity" value={formatPercent(sessionLookup.data?.similarity_score)} />
            <Metric label="Inference" value={formatMilliseconds(sessionLookup.data?.inference_time_ms)} />
          </dl>

          <JsonBlock data={sessionLookup.data ?? { status: sessionLookup.status, error: sessionLookup.error }} />
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck size={20} className="text-cyan-700" />
            <h2 className="text-lg font-semibold tracking-normal">Client Decision</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <DecisionStep
              title="1. SDK Callback"
              value={sdkAttempt.result?.verdict ?? sdkAttempt.state}
              detail={sdkAttempt.result?.sessionId ?? 'waiting for session id'}
            />
            <DecisionStep
              title="2. Session Lookup"
              value={lookupLabel(sessionLookup.status)}
              detail={getSessionDecisionDetail(sessionLookup)}
            />
            <DecisionStep
              title="3. App State"
              value={sdkAttempt.state === 'verified' ? 'login accepted' : 'login pending'}
              detail={sessionLookup.status === 'success' ? 'server details attached' : 'client may retry lookup'}
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
        className="pointer-events-none absolute inset-0 z-0"
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      {children}
    </div>
  )
}

function useAnimatedGradient(canvasRef: RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl: WebGLRenderingContext | null =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    if (!gl) return
    const context = gl

    const vertexSource = `
      attribute vec4 a_position;
      void main() {
        gl_Position = a_position;
      }
    `

    const fragmentSource = `
      precision highp float;
      uniform vec2 u_resolution;
      uniform float u_time;

      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= u_resolution.x / u_resolution.y;

        float t = u_time * 0.35;
        float wave = sin((p.x + t) * 2.6) + cos((p.y - t) * 3.1);
        float glow = smoothstep(1.2, -0.2, length(p + vec2(sin(t) * 0.3, cos(t * 0.7) * 0.2)));

        vec3 base = vec3(0.08, 0.1, 0.18);
        vec3 cyan = vec3(0.05, 0.65, 0.86);
        vec3 violet = vec3(0.38, 0.24, 0.9);
        vec3 coral = vec3(0.92, 0.32, 0.42);

        vec3 color = mix(base, violet, glow * 0.7);
        color = mix(color, cyan, smoothstep(-1.0, 1.0, wave) * 0.35);
        color = mix(color, coral, smoothstep(0.2, 1.3, p.x - p.y + sin(t)) * 0.22);
        color += (random(gl_FragCoord.xy + u_time) - 0.5) * 0.06;

        gl_FragColor = vec4(color, 1.0);
      }
    `

    function loadShader(type: number, source: string) {
      const shader = context.createShader(type)
      if (!shader) return null
      context.shaderSource(shader, source)
      context.compileShader(shader)
      return shader
    }

    const vertexShader = loadShader(context.VERTEX_SHADER, vertexSource)
    const fragmentShader = loadShader(context.FRAGMENT_SHADER, fragmentSource)
    const program = context.createProgram()

    if (!program || !vertexShader || !fragmentShader) return

    context.attachShader(program, vertexShader)
    context.attachShader(program, fragmentShader)
    context.linkProgram(program)
    context.useProgram(program)

    const positionBuffer = context.createBuffer()
    context.bindBuffer(context.ARRAY_BUFFER, positionBuffer)
    context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), context.STATIC_DRAW)

    const positionAttributeLocation = context.getAttribLocation(program, 'a_position')
    context.enableVertexAttribArray(positionAttributeLocation)
    context.vertexAttribPointer(positionAttributeLocation, 2, context.FLOAT, false, 0, 0)

    const timeLocation = context.getUniformLocation(program, 'u_time')
    const resolutionLocation = context.getUniformLocation(program, 'u_resolution')

    let animationFrameId = 0
    let lastTime = 0
    let dynamicTime = 0

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.floor(entry.contentRect.width)
        const height = Math.floor(entry.contentRect.height)

        if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
          canvas.width = width
          canvas.height = height
          context.viewport(0, 0, width, height)
          context.uniform2f(resolutionLocation, width, height)
        }
      }
    })

    resizeObserver.observe(canvas)

    function render(time: number) {
      const deltaTime = (time - lastTime) * 0.001 || 0.016
      lastTime = time
      dynamicTime += deltaTime

      context.uniform1f(timeLocation, dynamicTime)
      context.drawArrays(context.TRIANGLE_STRIP, 0, 4)
      animationFrameId = requestAnimationFrame(render)
    }

    animationFrameId = requestAnimationFrame(render)

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationFrameId)
      context.deleteProgram(program)
      context.deleteShader(vertexShader)
      context.deleteShader(fragmentShader)
      if (positionBuffer) context.deleteBuffer(positionBuffer)
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
