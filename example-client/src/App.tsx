import { useState, useCallback, useEffect } from "react";

/**
 * =============================================================================
 * SPECTRE SNAP SDK — IMPORT
 *
 * This is EXACTLY how a third-party developer would integrate.
 * Two imports: the component + the stylesheet.
 * =============================================================================
 */
import { SpectreAuthModal } from "@thewhitenigs/spectre-snap";
import type { SpectreAuthResult, SpectreFailureReason } from "@thewhitenigs/spectre-snap";
import "@thewhitenigs/spectre-snap/style.css";

// ---------------------------------------------------------------------------
// Configuration — a real client would source these from their own env/config
// ---------------------------------------------------------------------------
const SPECTRE_API_KEY = "spk_d602c7bc3c25e1bc12345678abcdef1234567890abcdef1234567890abcdef12";
const EXTERNAL_USER_ID = "acme-user-001";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Toast {
  type: "success" | "error";
  title: string;
  detail: string;
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export function App() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [lastResult, setLastResult] = useState<SpectreAuthResult | null>(null);
  const [userId, setUserId] = useState(EXTERNAL_USER_ID);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  // -------------------------------------------------------------------------
  // SDK Callbacks — this is the developer's contract with Spectre
  // -------------------------------------------------------------------------
  const handleSuccess = useCallback((result: SpectreAuthResult) => {
    console.log("[Acme] ✅ Spectre onSuccess:", result);
    setLastResult(result);
    setToast({
      type: "success",
      title: "Identity Verified",
      detail: `session: ${result.sessionId ?? "n/a"} | verdict: ${result.verdict}`,
    });
    // In production: set auth cookie, redirect to dashboard, etc.
    setTimeout(() => setScannerOpen(false), 2000);
  }, []);

  const handleFailed = useCallback((reason: SpectreFailureReason, result?: SpectreAuthResult) => {
    console.log("[Acme] ❌ Spectre onFailed:", reason, result);
    if (result) setLastResult(result);
    setToast({
      type: "error",
      title: "Verification Failed",
      detail: `reason: ${reason}`,
    });
  }, []);

  const handleClose = useCallback(() => {
    console.log("[Acme] 🚪 Spectre onClose");
    setScannerOpen(false);
  }, []);

  const handleReady = useCallback(() => {
    console.log("[Acme] 📷 Spectre onReady — camera active");
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div className={`status-toast ${toast.type}`}>
          <div className="toast-title">{toast.title}</div>
          <div className="toast-detail">{toast.detail}</div>
        </div>
      )}

      <div className="login-card">
        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="22" x2="12" y2="15.5" />
              <polyline points="22 8.5 12 15.5 2 8.5" />
            </svg>
          </div>
          <h1 className="logo-title">Acme Corp</h1>
          <p className="logo-subtitle">
            Third-party client integration test.<br />
            Login with biometric identity via Spectre.
          </p>
        </div>

        {/* ================================================================
            THE SPECTRE BUTTON — Primary SDK integration point.
            A real developer puts this button somewhere in their login UI
            and opens the SpectreAuthModal on click.
            ================================================================ */}
        <button
          id="login-with-spectre"
          className="spectre-btn"
          onClick={() => setScannerOpen(true)}
        >
          <svg className="face-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
            <rect x="3" y="3" width="18" height="18" rx="5" />
          </svg>
          Login with Spectre
        </button>

        {/* Divider */}
        <div className="divider">
          <div className="divider-line" />
          <span className="divider-text">or continue with email</span>
          <div className="divider-line" />
        </div>

        {/* Traditional Login Form (decorative, for context) */}
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label className="form-label" htmlFor="user-id-input">External User ID</label>
            <input
              id="user-id-input"
              className="form-input"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="e.g. user@example.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              className="form-input"
              type="password"
              placeholder="••••••••"
              disabled
            />
          </div>
          <button className="submit-btn" type="submit" disabled>
            Sign In (disabled — use Spectre)
          </button>
        </form>

        {/* Last Result Display */}
        {lastResult && (
          <div className="result-section">
            <div className="result-title">Last Spectre Result</div>
            <div className="result-row">
              <span className="result-key">Verdict</span>
              <span className={`result-value ${lastResult.verdict === "ok" ? "success" : "error"}`}>
                {lastResult.verdict.toUpperCase()}
              </span>
            </div>
            <div className="result-row">
              <span className="result-key">Label</span>
              <span className="result-value">{lastResult.label}</span>
            </div>
            {lastResult.sessionId && (
              <div className="result-row">
                <span className="result-key">Session ID</span>
                <span className="result-value">{lastResult.sessionId.slice(0, 8)}…</span>
              </div>
            )}
            <div className="result-row">
              <span className="result-key">Live Score</span>
              <span className="result-value success">
                {(lastResult.summary.live * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p>
            Powered by <a href="https://github.com/spectre" target="_blank" rel="noopener">Spectre Snap SDK</a> v1.0.0
          </p>
        </div>
      </div>

      {/* =================================================================
          SPECTRE AUTH MODAL — The SDK component.
          This is the entire integration. The consumer just passes:
          - apiKey
          - userId
          - callbacks
          Everything else (camera, ML, UI, API calls) is handled by the SDK.
          ================================================================= */}
      <SpectreAuthModal
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        apiKey={SPECTRE_API_KEY}
        userId={userId}
        mode="auto"
        onSuccess={handleSuccess}
        onFailed={handleFailed}
        onClose={handleClose}
        onReady={handleReady}
      />
    </>
  );
}
