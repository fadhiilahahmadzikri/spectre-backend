import { useState, useCallback, useEffect } from "react";
import { SpectreAuthModal } from "@thewhitenigs/spectre-snap";
import type { SpectreAuthResult, SpectreFailureReason } from "@thewhitenigs/spectre-snap";
import {
  Shield, CheckCircle2, XCircle, ChevronRight, ScanFace,
  LayoutDashboard, Users, FileCheck, Settings, LogOut,
  TrendingUp, Clock, AlertTriangle, Activity,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

/* ── env ── */
const API_KEY = import.meta.env.VITE_SPECTRE_API_KEY ?? "";

/* ── dummy data ── */
const WEEKLY_VERIFICATIONS = [
  { day: "Mon", success: 34, failed: 2 },
  { day: "Tue", success: 41, failed: 5 },
  { day: "Wed", success: 28, failed: 1 },
  { day: "Thu", success: 55, failed: 3 },
  { day: "Fri", success: 62, failed: 4 },
  { day: "Sat", success: 18, failed: 0 },
  { day: "Sun", success: 12, failed: 1 },
];

const MONTHLY_TREND = [
  { month: "Jan", users: 120 },
  { month: "Feb", users: 210 },
  { month: "Mar", users: 340 },
  { month: "Apr", users: 480 },
  { month: "May", users: 610 },
];

const RECENT_EVENTS = [
  { id: "sess-001", user: "fadhiilah@amikom.ac.id", status: "AUTHENTICATED", score: 0.97, time: "2 min ago" },
  { id: "sess-002", user: "john@acme.co", status: "REGISTERED", score: 0.94, time: "8 min ago" },
  { id: "sess-003", user: "alice@startup.io", status: "SPOOF_DETECTED", score: 0.12, time: "15 min ago" },
  { id: "sess-004", user: "bob@corp.com", status: "AUTHENTICATED", score: 0.91, time: "22 min ago" },
  { id: "sess-005", user: "admin@bank.id", status: "AUTHENTICATED", score: 0.95, time: "31 min ago" },
];

/* ── helpers ── */
function getStoredUserId() {
  return localStorage.getItem("kyc_user_id") || "fadhiilah@amikom.ac.id";
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  APP                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */
type View = "kyc" | "dashboard";

export default function App() {
  const [view, setView] = useState<View>("kyc");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [result, setResult] = useState<SpectreAuthResult | null>(null);
  const [userId, setUserId] = useState(getStoredUserId);

  // Persist userId changes
  const updateUserId = useCallback((id: string) => {
    setUserId(id);
    localStorage.setItem("kyc_user_id", id);
  }, []);

  const handleSuccess = useCallback((r: SpectreAuthResult) => {
    setResult(r);
    setScannerOpen(false);
    setTimeout(() => setView("dashboard"), 600);
  }, []);

  const handleFailed = useCallback((reason: SpectreFailureReason) => {
    console.error("[KYC] Verification failed:", reason);
    setScannerOpen(false);
  }, []);

  return (
    <>
      {view === "kyc" ? (
        <KycPage
          onStart={() => setScannerOpen(true)}
          verified={!!result}
          userId={userId}
          onUserIdChange={updateUserId}
        />
      ) : (
        <Dashboard
          result={result}
          onLogout={() => { setView("kyc"); setResult(null); }}
        />
      )}

      <SpectreAuthModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        apiKey={API_KEY}
        userId={userId}
        mode="auto"
        onSuccess={handleSuccess}
        onFailed={handleFailed}
        onClose={() => setScannerOpen(false)}
      />
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  KYC VERIFICATION PAGE                                                    */
/* ────────────────────────────────────────────────────────────────────────── */
function KycPage({ onStart, verified, userId, onUserIdChange }: {
  onStart: () => void; verified: boolean; userId: string; onUserIdChange: (id: string) => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 rounded-lg bg-brand/15 flex items-center justify-center">
          <Shield className="w-5 h-5 text-brand" />
        </div>
        <span className="text-xl font-semibold tracking-tight">NusaBank</span>
        <span className="text-[10px] font-medium tracking-wider uppercase text-fg-muted bg-surface-2 px-2 py-0.5 rounded">KYC Portal</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-5">
            <ScanFace className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-lg font-semibold mb-2">Identity Verification</h1>
          <p className="text-sm text-fg-muted leading-relaxed">
            Complete biometric verification to activate your account.
            This process uses AI-powered liveness detection.
          </p>
        </div>

        {/* User ID input */}
        <div className="px-6 pb-4">
          <label className="text-xs text-fg-muted font-medium block mb-1.5">Customer ID / Email</label>
          <input
            type="text"
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
            placeholder="your@email.com"
            className="w-full h-9 px-3 rounded-md bg-surface-2 border border-border text-sm text-fg
                       placeholder:text-fg-dim focus:outline-none focus:border-brand/50 transition"
          />
          <p className="text-[10px] text-fg-dim mt-1">Used to identify your face profile in this application.</p>
        </div>

        {/* Steps */}
        <div className="px-6 pb-6 space-y-3">
          <Step num={1} title="Face Capture" desc="Camera will capture your face in real-time" done={verified} />
          <Step num={2} title="Liveness Check" desc="AI verifies you are a real person" done={verified} />
          <Step num={3} title="Identity Match" desc="Your face is matched to your profile" done={verified} />
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* CTA */}
        <div className="px-6 py-5">
          <button
            onClick={onStart}
            disabled={!userId.trim()}
            className="w-full h-10 rounded-md bg-brand text-bg font-medium text-sm
                       hover:bg-brand-strong active:scale-[0.98] transition-all
                       flex items-center justify-center gap-2 cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ScanFace className="w-4 h-4" />
            Begin Verification
            <ChevronRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-fg-dim text-center mt-3">
            Powered by <span className="text-fg-muted font-medium">Spectre</span> · Face ID Technology
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center gap-4 text-[11px] text-fg-dim">
        <span>AES-256 Encrypted</span>
        <span className="w-1 h-1 rounded-full bg-border-strong" />
        <span>GDPR Compliant</span>
        <span className="w-1 h-1 rounded-full bg-border-strong" />
        <span>ISO 27001</span>
      </div>
    </div>
  );
}

function Step({ num, title, desc, done }: { num: number; title: string; desc: string; done: boolean }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-surface-2/50 border border-border/50">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
        ${done ? "bg-brand/20 text-brand" : "bg-border/50 text-fg-dim"}`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : num}
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-fg-muted">{desc}</div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  DASHBOARD                                                                */
/* ────────────────────────────────────────────────────────────────────────── */
function Dashboard({ result, onLogout }: { result: SpectreAuthResult | null; onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState("overview");

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0">
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border">
          <Shield className="w-5 h-5 text-brand" />
          <span className="font-semibold text-sm">NusaBank</span>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5">
          <NavItem icon={LayoutDashboard} label="Overview" id="overview" active={activeNav} onClick={setActiveNav} />
          <NavItem icon={Users} label="Customers" id="customers" active={activeNav} onClick={setActiveNav} />
          <NavItem icon={FileCheck} label="Verifications" id="verifications" active={activeNav} onClick={setActiveNav} />
          <NavItem icon={Activity} label="Monitoring" id="monitoring" active={activeNav} onClick={setActiveNav} />
          <NavItem icon={Settings} label="Settings" id="settings" active={activeNav} onClick={setActiveNav} />
        </nav>

        <div className="px-3 pb-4">
          <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-fg-muted hover:text-fg hover:bg-surface-2 transition cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-surface/50 sticky top-0 z-10 backdrop-blur-sm">
          <h2 className="font-semibold text-sm">Dashboard Overview</h2>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/10 text-brand text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" /> KYC Verified
            </span>
            <div className="w-7 h-7 rounded-full bg-brand/20 flex items-center justify-center text-xs font-bold text-brand">
              N
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Verification success banner */}
          {result && <SuccessBanner result={result} />}

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard icon={CheckCircle2} label="Verified Users" value="1,247" change="+12.3%" positive />
            <StatCard icon={TrendingUp} label="Success Rate" value="96.8%" change="+2.1%" positive />
            <StatCard icon={AlertTriangle} label="Spoof Attempts" value="16" change="-34%" positive />
            <StatCard icon={Clock} label="Avg. Time" value="3.2s" change="-0.4s" positive />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Weekly verifications */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-1">Weekly Verifications</h3>
              <p className="text-xs text-fg-muted mb-4">Success vs failed attempts</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={WEEKLY_VERIFICATIONS} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8F8F8F" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#8F8F8F" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: "#2A2A2A", border: "1px solid #444", borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: "#EDEDED" }}
                    labelStyle={{ color: "#8F8F8F", fontWeight: 600 }}
                  />
                  <Bar dataKey="success" fill="#3ECF8E" radius={[3, 3, 0, 0]} name="Success" />
                  <Bar dataKey="failed" fill="#F87171" radius={[3, 3, 0, 0]} name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly growth */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-1">User Growth</h3>
              <p className="text-xs text-fg-muted mb-4">Verified users over time</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={MONTHLY_TREND}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3ECF8E" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3ECF8E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8F8F8F" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#8F8F8F" }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: "#2A2A2A", border: "1px solid #444", borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: "#EDEDED" }}
                    labelStyle={{ color: "#8F8F8F", fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="users" stroke="#3ECF8E" fill="url(#grad)" strokeWidth={2} name="Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent events table */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">Recent Verification Events</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-fg-muted">
                  <th className="text-left font-medium px-5 py-3">Session</th>
                  <th className="text-left font-medium px-5 py-3">User</th>
                  <th className="text-left font-medium px-5 py-3">Status</th>
                  <th className="text-left font-medium px-5 py-3">Confidence</th>
                  <th className="text-left font-medium px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_EVENTS.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-surface-2/40 transition">
                    <td className="px-5 py-3 font-mono text-xs text-fg-muted">{e.id}</td>
                    <td className="px-5 py-3">{e.user}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={e.status} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs">{(e.score * 100).toFixed(0)}%</td>
                    <td className="px-5 py-3 text-fg-muted text-xs">{e.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function SuccessBanner({ result }: { result: SpectreAuthResult }) {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShow(false), 8000); return () => clearTimeout(t); }, []);
  if (!show) return null;
  return (
    <div className="bg-brand/8 border border-brand/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-400">
      <CheckCircle2 className="w-5 h-5 text-brand shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-brand">KYC Verification Complete</div>
        <div className="text-xs text-fg-muted mt-1">
          Session <span className="font-mono">{result.sessionId?.slice(0, 8) ?? "—"}</span>
          {" · "}Liveness <span className="font-mono">{((result.livenessScore ?? 0) * 100).toFixed(0)}%</span>
          {result.similarityScore != null && (
            <>{" · "}Match <span className="font-mono">{(result.similarityScore * 100).toFixed(0)}%</span></>
          )}
          {" · "}<span className="font-mono">{result.inferenceTimeMs ?? 0}ms</span>
        </div>
      </div>
      <button onClick={() => setShow(false)} className="text-fg-dim hover:text-fg text-xs cursor-pointer">✕</button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, positive }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; change: string; positive: boolean;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-fg-muted font-medium">{label}</span>
        <Icon className="w-4 h-4 text-fg-dim" />
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className={`text-xs mt-1 ${positive ? "text-brand" : "text-danger"}`}>{change} from last week</div>
    </div>
  );
}

function NavItem({ icon: Icon, label, id, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; id: string; active: string;
  onClick: (id: string) => void;
}) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition cursor-pointer
        ${isActive ? "bg-surface-2 text-fg font-medium" : "text-fg-muted hover:text-fg hover:bg-surface-2/50"}`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    AUTHENTICATED: { bg: "bg-brand/12", text: "text-brand", label: "Verified" },
    REGISTERED: { bg: "bg-info/12", text: "text-info", label: "Registered" },
    SPOOF_DETECTED: { bg: "bg-danger/12", text: "text-danger", label: "Spoof" },
    REJECTED: { bg: "bg-warning/12", text: "text-warning", label: "Rejected" },
    FAILED: { bg: "bg-danger/12", text: "text-danger", label: "Failed" },
  };
  const s = map[status] ?? { bg: "bg-border/20", text: "text-fg-muted", label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}
