 give the best

  Locked in:

  - Q4 → (c) Keep /scan URL, render as rising overlay on top of Layout — URL-addressable, iOS feel, best engineering
  - Q6 → (b) MediaPipe stays CDN (useScriptLoader) for parity; sonner replaces Toastify; custom SVG RadialChart replaces
  ApexCharts (lighter, matches aesthetic)
  - Q7 → (c) Vitest + RTL for pure logic only (IQA math, schema, parsers, phase guards) — skip flaky camera/mesh
  component tests

  Here is the full plan.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Implementation Plan — POC → TypeScript Frontend Migration

  Problem Statement

  The frontend/poc/ namespace is a ~2,900-line monolithic Babel-standalone React prototype (app.js + aura-ring.jsx +
  styles.css + index.html) that defines the product's entire visual identity, interaction flow, and scanning pipeline. A
  previous partial migration under src/features/face-scan/ has visual and behavioral regressions (wrong palette,
  purple/indigo where POC uses white+blue-glass, missing iris-shell morph, missing CornerFrame, missing
  ConfigDrawer/AnalysisDrawer/PreviewModal/IOSAlert/ProgressiveLog/ChecklistOverlay, wrong fonts, no logo, no rising
  modal). The POC remains the canonical visual/behavioral reference and must not be deleted. We need to re-migrate the
  POC into the production TypeScript frontend as a properly decomposed, typed, shadcn-composed feature while propagating
  the POC's design tokens across the whole app.

  Requirements (from Q&A)

  ┌─────────────────────┬────────────────────────────┬───────────────────────────────────────────────────────────────┐
  │ #                   │ Decision                   │ Value                                                         │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Preservation        │ Feature parity             │ 100% visual + behavioral parity with POC; only engineering    │
  │                     │                            │ improves                                                      │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Code boundary       │ POC stays                  │ frontend/poc/ is preserved as the reference of truth; never   │
  │                     │                            │ deleted                                                       │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Target arch         │ Stack                      │ React 19 + TS + Vite + Tailwind v4 + Framer Motion + Zustand  │
  │                     │                            │ + React Query + React Router 7                                │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ UI kit              │ shadcn                     │ Full shadcn init (nova style, Tailwind v4, radix base);       │
  │                     │                            │ install primitives (Dialog, Drawer, Sheet, Button, Input,     │
  │                     │                            │ Field, FieldGroup, Label, Switch, ToggleGroup, Tabs, Badge,   │
  │                     │                            │ Alert, AlertDialog, Separator, Sonner, Skeleton, Spinner)     │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Design-system scope │ Synchronize                │ Propagate POC tokens + identity to all existing pages (Login, │
  │                     │                            │ Register, VerifyEmail, Dashboard, Applications, ApiKeys,      │
  │                     │                            │ Layout)                                                       │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Logo                │ Integrate POC logo         │ poc/assets/logo/LOGO.svg → public/logo.svg, exposed via       │
  │                     │                            │ FaceIDGlyph icon component                                    │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Trigger surface     │ /scan URL → rising overlay │ Visiting /scan stacks a bottom-up rising full-screen modal    │
  │                     │                            │ over Layout; close returns to previous page                   │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Gate input          │ API key only               │ POC's IdentityGate adapted to paste an spk_... API key;       │
  │                     │                            │ external_user_id auto-sourced from logged-in user             │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Deps                │ Hybrid                     │ MediaPipe via CDN (useScriptLoader, unchanged). Toastify →    │
  │                     │                            │ sonner. ApexCharts → custom SVG RadialChart                   │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Tests               │ Vitest + RTL, logic only   │ Unit tests for computeIQA, computeEAR, zod schemas,           │
  │                     │                            │ parseSummary/parseDetail, hexToRgb/rgbToHex, phase guards     │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Quality bars        │ Continuous                 │ Every task ends with npm run lint, npm run build, npm test    │
  │                     │                            │ passing                                                       │
  ├─────────────────────┼────────────────────────────┼───────────────────────────────────────────────────────────────┤
  │ Code style          │ Publication-ready          │ No unnecessary comments, no JSDoc blocks, no emojis;          │
  │                     │                            │ expressive names + small modules                              │
  └─────────────────────┴────────────────────────────┴───────────────────────────────────────────────────────────────┘

  Background (findings from POC analysis)

  POC structure (confirmed by reading every file)

  poc/app.js (2,925 lines) contains:

  - Config & constants (L1–100): API_URL, PHASES, IQA, IQA_FEEDBACK, IQA_THRESHOLDS, FAS_CLASSES, CANVAS_PHASES,
  VIGNETTE_PHASES, ACTIVE_PHASES, TERMINAL_PHASES, SCAN_GEOMETRY (NUM_SEGMENTS=60, ANGLE_STEP=6, RADIUS_INNER=135,
  RADIUS_OUTER=155, CENTER=200, VIDEO_DISPLAY_SIZE=400)
  - Pure logic (L100–200): getIqaSchema, computeIQA, computeEAR, captureBase64FromVideo, parseSummary, parseDetail
  - Hooks (L200–570): useScriptLoader, useGlitchOpacity, useFaceMesh, useBrightness, useBlurMetrics, useIQA (with
  MSG_COOLDOWN_MS throttling)
  - API client (L573–633): FaceAPIClient with register, authenticate, listProfiles, deleteProfile, purgeAll, lookupUser
  - Icons (L633–676): FaceIDGlyph, MoreVertIcon, CloseIcon, RefreshIcon, ArrowRightIcon
  - Display components (L677–1150): RadialChartCDN (ApexCharts), SystemOverlayScreen, CornerFrame, AnimatedStatusIcon,
  ChecklistOverlay, ProgressiveLog, ResultPanel, HistoryTable, IOSAlert, PreviewModal
  - Drawers (L1052–1400): AnalysisDrawer, ConfigDrawer
  - IdentityGate (L1398–1570): API key + user-id gate screen
  - AuraRing (L1574–2074): canvas aura + sphere body + eyes + physics
  - ScannerView (L2074–2900): the orchestrator (10 phases, 800+ lines)
  - App (L2899–2925): picks gate or scanner

  poc/styles.css (22KB): Apple-style dark tokens:

  - CSS vars: --bg (#000), --bg-elev (#1c1c1e), --bg-tertiary (#2c2c2e), label hierarchy
  (primary/secondary/tertiary/quaternary), fill hierarchy, --separator, --surface/--surface-2, --border/--border-strong,
  --blue-glass/--blue-glow, --sys-red/--sys-orange/--sys-green, --danger/--warn/--ok, --radius-xs..--radius-2xl,
  --font-sans: BlinkMacSystemFont, -apple-system, system-ui, sans-serif
  - Utility classes: .glass, .glass-strong, .glass-blue, .iris-shell (+ .is-square, .is-circle w/ 760ms cubic-bezier
  transition), .scrim-vignette, .face-helper, .face-title, .tab-pill, .tab-segmented, .icon-btn, .input-mono,
  .btn-primary, .btn-ghost, .btn-danger-soft, .toggle-switch, .log-entry (+ is-ok/is-warn/is-err/is-active),
  .drawer-handle, .mode-indicator (+ is-register/is-verify), .mode-indicator-dot, .user-chip, .verdict-chip,
  .ios-alert-box, .gate-icon-ring, .gate-separator, .gate-spinner, .scanning-header, .scanning-center-brand,
  .mode-toggle-row, .app-shell, .app-content, .bg-aura, .bg-gradient-bottom, .iris-section, .iris-area, .config-drawer,
  .drawer-panel, .result-section-card, .completion-overlay, .completion-card, .section-label, .kbd-mono, .shimmer,
  .bar-track/.bar-fill, .history-row, .log-stack, .log-replacement-container, .checkmark-ring/.checkmark-tick,
  .cross-tick, .corner-frame-ready/.corner-frame-warn
  - Animations: drawRing, drawTick, shimmerSweep, iqaPulseWarn, iqaPulseReady, spin, fadeInUp, fadeInScale, dotPulse,
  dotPulseRing

  poc/component/aura-ring.jsx (24KB): canvas 4-layer aura + 3D sphere body + expressive eyes (normal | senang | sedih |
  lengkungan) + spring-bounce physics + 3D perspective eye rotation + blink animation

  poc/index.html: loads React 18 UMD, Framer Motion 10, Zod 3, Babel standalone, Toastify — the migration must replicate
  all runtime behaviors without these CDN dependencies except MediaPipe (user confirmed).

  Current frontend state

  - frontend/package.json: React 19, Vite 8, Tailwind v4, Framer Motion 11, Zod 4, Zustand 5, TanStack Query 5, React
  Router 7 (no shadcn, no test framework)
  - src/index.css: essentially empty (24 bytes)
  - src/features/face-scan/**: partial migration (ScannerView, AuraRing, IdentityGate, constants, store, client, hooks,
  iqa) — will be replaced file-by-file during the plan
  - src/pages/: Login, Register, VerifyEmail, Dashboard, Applications, ApiKeys, FaceScan, OAuthCallback — all use
  generic Tailwind utility classes (no POC identity)

  Proposed Solution

  Architecture (feature-sliced design)

  src/
  ├── app/
  │   ├── providers/          (QueryProvider, TooltipProvider)
  │   ├── router.tsx          (routes w/ /scan overlay mounted over Layout)
  │   └── styles/
  │       ├── tokens.css      (@theme block: POC tokens → Tailwind v4 variables)
  │       ├── utilities.css   (POC utility classes: glass, iris-shell, btn-*, etc.)
  │       └── animations.css  (POC @keyframes)
  ├── shared/
  │   ├── ui/                 (shadcn primitives: button, dialog, drawer, sheet, input, field, switch, toggle-group,
  badge, alert, separator, sonner, skeleton, spinner, tabs)
  │   ├── icons/              (FaceIDGlyph, MoreVertIcon, CloseIcon, RefreshIcon, ArrowRightIcon — ported from POC)
  │   ├── lib/                (cn, env, http)
  │   └── hooks/              (useMediaQuery, useScriptLoader)
  ├── entities/
  │   ├── user/               (useCurrentUser, external-user-id selector)
  │   └── api-key/            (selectors for logged-in user's API keys)
  ├── features/
  │   ├── face-scan/
  │   │   ├── api/
  │   │   │   └── face-client.ts
  │   │   ├── model/
  │   │   │   ├── constants.ts       (PHASES, IQA_STATE, IQA_FEEDBACK, IQA_THRESHOLDS, SCAN_GEOMETRY,
  CANVAS/VIGNETTE/ACTIVE/TERMINAL_PHASES, DEFAULT_AURA_CONFIG, FAS_CLASSES, FAS_LABELS, MODE_REGISTER/AUTHENTICATE)
  │   │   │   ├── types.ts
  │   │   │   ├── scan-store.ts      (zustand)
  │   │   │   └── iqa-schema.ts      (zod)
  │   │   ├── lib/
  │   │   │   ├── compute-iqa.ts
  │   │   │   ├── compute-ear.ts
  │   │   │   ├── capture-frame.ts
  │   │   │   ├── parse-probs.ts
  │   │   │   ├── hex-utils.ts
  │   │   │   └── phase-guards.ts
  │   │   ├── hooks/
  │   │   │   ├── use-face-mesh.ts
  │   │   │   ├── use-brightness.ts
  │   │   │   ├── use-blur-metrics.ts
  │   │   │   ├── use-iqa.ts
  │   │   │   ├── use-glitch-opacity.ts
  │   │   │   ├── use-progressive-log.ts
  │   │   │   └── use-redirect-countdown.ts
  │   │   ├── ui/
  │   │   │   ├── ScannerModal.tsx           (rising overlay root, shadcn Drawer w/ bottom snap)
  │   │   │   ├── IdentityGate.tsx           (API key field + verify)
  │   │   │   ├── ScannerView.tsx            (orchestrator)
  │   │   │   ├── aura-ring/
  │   │   │   │   ├── AuraRing.tsx
  │   │   │   │   ├── SphereBody.tsx
  │   │   │   │   ├── AuraCanvas.tsx
  │   │   │   │   ├── Eyes.tsx
  │   │   │   │   └── use-aura-physics.ts
  │   │   │   ├── iris-shell/
  │   │   │   │   ├── IrisShell.tsx          (square ↔ circle, 760ms)
  │   │   │   │   ├── CornerFrame.tsx
  │   │   │   │   └── ScrimVignette.tsx
  │   │   │   ├── segments/
  │   │   │   │   └── SegmentRing.tsx        (60 SVG segments)
  │   │   │   ├── overlays/
  │   │   │   │   ├── SystemOverlayScreen.tsx
  │   │   │   │   ├── ChecklistOverlay.tsx
  │   │   │   │   ├── AnimatedStatusIcon.tsx
  │   │   │   │   ├── ProgressiveLog.tsx
  │   │   │   │   └── CaptureFlash.tsx
  │   │   │   ├── header/
  │   │   │   │   ├── ScanningHeader.tsx
  │   │   │   │   └── ModeIndicator.tsx
  │   │   │   ├── dialogs/
  │   │   │   │   ├── PreviewDialog.tsx      (shadcn Dialog)
  │   │   │   │   ├── IOSAlertDialog.tsx     (shadcn AlertDialog)
  │   │   │   │   ├── AnalysisDrawer.tsx     (shadcn Drawer)
  │   │   │   │   └── ConfigDrawer.tsx       (shadcn Drawer)
  │   │   │   └── result/
  │   │   │       ├── ResultPanel.tsx
  │   │   │       └── RadialChart.tsx        (custom SVG)
  │   │   └── index.ts
  │   └── auth/               (existing pages rewrapped in new design system)
  ├── pages/                  (each page re-themed with POC tokens)
  ├── components/Layout.tsx   (refactored: AppShell, AppHeader, scan trigger)
  └── main.tsx

  State-machine summary (preserved from POC)

  USER_ID ─(paste+verify API key)─► LOADING
    │
    ▼
  LOADING ─(camera ready)─► SEARCHING
    │
    ▼
  SEARCHING ─(IQA.READY)─► MORPHING (reveal 60 segments)
    │
    ▼
  MORPHING ─(requirePose)─► SCANNING
  MORPHING ─(!requirePose, auto-capture)─► CAPTURING
    │
    ▼
  SCANNING ─(segments ≥ NUM_SEGMENTS-2)─► CAPTURING
    │
    ▼
  CAPTURING ─(showPreview=true)─► PREVIEW
  CAPTURING ─(showPreview=false)─► ANALYZING
    │
    ▼
  PREVIEW ─(submit)─► ANALYZING
  PREVIEW ─(retake)─► LOADING (reset)
    │
    ▼
  ANALYZING ─(200/202)─► COMPLETE
  ANALYZING ─(LIVENESS_CHECK_FAILED)─► FAILED (+ open AnalysisDrawer 1.8s later)
  ANALYZING ─(FACE_MATCH_FAILED | other)─► FAILED
    │
    ▼
  COMPLETE ─(mode=AUTHENTICATE)─► redirect countdown + external URL
  COMPLETE ─(mode=REGISTER, 2.8s)─► switch mode to AUTHENTICATE
  FAILED ─(Pindai Ulang)─► reset to LOADING

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task Breakdown

  Task 1: Bootstrap foundations — shadcn init, testing harness, lint gate

  Objective: Install shadcn/ui properly and add a test framework so every subsequent task can validate itself.

  Implementation guidance:

  - Run npx shadcn@latest init --template vite --preset nova (Tailwind v4, radix base). Accept detected aliases (@/*).
  - Install primitives one pass: npx shadcn@latest add button input label dialog drawer sheet field-group toggle-group
  switch tabs separator badge alert alert-dialog sonner skeleton spinner (adjust registry name per info output).
  - Wire the Toaster (sonner) into main.tsx.
  - Install Vitest + React Testing Library: npm i -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
  jsdom @testing-library/user-event.
  - Add vitest.config.ts with jsdom environment + setup file (@testing-library/jest-dom), and test/test:watch/test:ui
   npm scripts.
  - Update eslint.config.js: ensure the test files + shadcn-generated src/components/ui/** are linted consistently (or
  ignored for registry UI as shadcn recommends).

  Test requirements: A trivial sanity.test.ts asserts expect(1+1).toBe(2). npm run lint, npm run build, npm test — all
  pass.

  Demo: npm run dev starts the app. A Button imported from @/components/ui/button renders with the nova style on a
  scratch page. npm test passes. npx shadcn@latest info shows the installed components.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 2: Port POC design tokens, utility classes, and animations into the Tailwind v4 layer

  Objective: Give the whole app the POC's Apple-style dark identity through a single source of truth, without coupling
  it to the face-scan feature yet.

  Implementation guidance:

  - Read poc/styles.css and translate to three files under src/app/styles/:
    - tokens.css — Tailwind v4 @theme inline block exposing every --bg/--bg-elev/--bg-tertiary, --label-*, --fill-*,
  --separator, --surface, --border*, --blue-glass/glow, --sys-*, --danger/warn/ok, --radius-*, --font-sans
  (BlinkMacSystemFont stack).
    - utilities.css — .glass, .glass-strong, .glass-blue, .iris-shell (+ .is-square, .is-circle), .scrim-vignette,
  .tab-pill, .tab-segmented, .icon-btn, .input-mono, .btn-primary, .btn-ghost, .btn-danger-soft, .toggle-switch,
  .log-entry family, .drawer-handle, .mode-indicator family, .user-chip, .verdict-chip, .ios-alert-box, .gate-icon-ring,
  .gate-separator, .gate-spinner, .scanning-header, .scanning-center-brand, .mode-toggle-row, .app-shell, .app-content,
  .bg-aura, .bg-gradient-bottom, .iris-section, .iris-area, .config-drawer, .drawer-panel, .result-section-card,
  .completion-overlay, .completion-card, .section-label, .kbd-mono, .shimmer, .bar-track, .bar-fill, .history-row,
  .log-stack, .log-replacement-container, .checkmark-ring, .checkmark-tick, .cross-tick, .corner-frame-ready,
  .corner-frame-warn.
    - animations.css — every keyframe: drawRing, drawTick, shimmerSweep, iqaPulseWarn, iqaPulseReady, spin, fadeInUp,
  fadeInScale, dotPulse, dotPulseRing, eye-blink.

  - Import them in order from src/index.css (@import "tailwindcss"; @import "./app/styles/tokens.css"; @import
  "./app/styles/utilities.css"; @import "./app/styles/animations.css";).
  - Apply the POC body setup (aura radial + gradient + safe-area padding) to html, body, #root.
  - Copy poc/assets/logo/LOGO.svg to public/logo.svg (replace the existing generic one).
  - Create src/shared/icons/FaceIDGlyph.tsx (<img src="/logo.svg" ...>), MoreVertIcon, CloseIcon, RefreshIcon,
  ArrowRightIcon — identical SVG markup to POC.

  Test requirements: Create an ephemeral /__design-preview route (removed at Task 14) that renders a page showing glass
  cards, iris-shell square/circle, all buttons, inputs, toggle, log entries, mode indicators, and the logo — so we can
  visually compare with the POC running at /poc/. No automated tests here (styling).

  Demo: Running npm run dev and opening /__design-preview produces the same surface treatments, typography, and colors
  as comparable sections of /poc/. The whole app's background changes to the POC's black+aura gradient.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 3: Re-theme Layout + existing pages with POC identity

  Objective: Propagate the new tokens across Login, Register, VerifyEmail, Dashboard, Applications, ApiKeys,
  OAuthCallback, and Layout — no behavior changes, only identity.

  Implementation guidance:

  - src/components/Layout.tsx → src/app/layout/ split into AppShell.tsx (root stage, .app-shell, background layers) and
  AppHeader.tsx (logo left, user-chip center or right, scan-CTA icon-btn right) — includes the /scan trigger using a
  shadcn Button styled as .icon-btn.
  - Rewrite each page's JSX to use POC primitives: .glass-strong cards, .btn-primary/.btn-ghost, .input-mono,
  .section-label, .kbd-mono, .user-chip, FaceIDGlyph logo in hero. Page behavior (auth routing, React Query wiring,
  validation) remains unchanged.
  - Replace any shadcn form controls used on these pages with the shadcn patterns from SKILL.md (FieldGroup + Field +
  InputGroup + ToggleGroup + Sonner toasts).

  Test requirements: Each page still renders without errors; existing route-level integration tests (if any) continue to
  pass. npm run lint clean; npm run build clean.

  Demo: Logging in shows the new POC-styled Login; the Dashboard and other pages now have consistent glassmorphism,
  BlinkMacSystemFont, POC logo in the header, and a Scan button in the header that navigates to /scan.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 4: Port POC domain model + pure logic with unit tests

  Objective: Lift every deterministic function out of the monolith into typed modules, covered by Vitest.

  Implementation guidance:

  - src/features/face-scan/model/constants.ts — PHASES, IQA_STATE, IQA_FEEDBACK, IQA_THRESHOLDS, SCAN_GEOMETRY,
  CANVAS_PHASES, VIGNETTE_PHASES, ACTIVE_PHASES, TERMINAL_PHASES, DEFAULT_AURA_CONFIG, FAS_CLASSES, FAS_LABELS,
  MODE_REGISTER, MODE_AUTHENTICATE, MSG_COOLDOWN_MS, REDIRECT_DELAY. Values must match POC byte-for-byte.
  - src/features/face-scan/model/types.ts — Phase, IqaState, ScanMode, AuraExpression, AuraLayerConfig, AuraConfig,
  Landmark, FaceApiResponse, ScanResult, ResultVerdict, IqaFailCode.
  - src/features/face-scan/model/iqa-schema.ts — zod schema with pose/no-pose variants (memoized; matches POC's
  getIqaSchema).
  - src/features/face-scan/lib/compute-ear.ts — identical math.
  - src/features/face-scan/lib/compute-iqa.ts — identical logic, returns { state, fails }.
  - src/features/face-scan/lib/capture-frame.ts — captureBase64FromVideo(video) returning base64 without the data:
   prefix.
  - src/features/face-scan/lib/parse-probs.ts — parseSummary(probs) + parseDetail(probs).
  - src/features/face-scan/lib/hex-utils.ts — hexToRgb, rgbToHex.
  - src/features/face-scan/lib/phase-guards.ts — isCanvasPhase, isVignettePhase, isTerminalPhase, isActivePhase,
  isScanningPhase, isIqaPhase.

  Test requirements: __tests__/compute-ear.test.ts, compute-iqa.test.ts (fixture-based: NO_FACE → READY transitions,
  each failure mode triggered independently, priority sort), parse-probs.test.ts, hex-utils.test.ts,
  phase-guards.test.ts. Target ≥ 90% coverage on lib/.

  Demo: npm test runs ~30 tests, all green. A node REPL can import computeIQA and reproduce POC's output for equivalent
  landmark inputs.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 5: Port foundational hooks (script loader, brightness, blur, glitch)

  Objective: Ship the observability hooks in isolation, each independently demoable.

  Implementation guidance:

  - src/shared/hooks/use-script-loader.ts — accepts readonly string[], dedupes existing <script src>, resolves when all
  loaded. Handles unmount safely.
  - src/features/face-scan/hooks/use-brightness.ts — 64×64 ImageData luminance sampler. Accepts videoRef, enabled,
  optional intervalMs.
  - src/features/face-scan/hooks/use-blur-metrics.ts — 128×128 Laplacian variance + rolling-window delta. Accepts
  videoRef, enabled, landmarks, intervalMs.
  - src/features/face-scan/hooks/use-glitch-opacity.ts — opacity schedule for scanning phases.

  Test requirements: use-script-loader.test.ts mocks document.head.appendChild to assert dedupe + ordered resolution.
  Camera hooks have a minimal smoke test that mounts a headless <video> and asserts hook output type.

  Demo: Temporary /__scan-dev route (removed at Task 14) renders a local webcam <video> and displays live luminance,
  blur level, blur delta, and glitch opacity numbers equivalent to POC's internal values.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 6: Port MediaPipe FaceMesh hook + IQA aggregation hook

  Objective: Land the camera + mesh detection pipeline with identical behavior to POC.

  Implementation guidance:

  - src/features/face-scan/hooks/use-face-mesh.ts — takes { videoRef, canvasRef, scriptsLoaded, phaseRef, iqaStateRef,
  onFaceFrame, onHeadMove }. Initializes new window.FaceMesh({...}) with identical options; wires mesh.onResults to draw
  tesselation with color based on IQA state (rgba(52,211,153,0.45) READY / rgba(248,113,113,0.55) NO_FACE /
  rgba(251,191,36,0.65) other). Starts new window.Camera(videoRef.current, { onFrame, width: 640, height: 480 }).
  Returns cameraReady.
  - src/features/face-scan/hooks/use-iqa.ts — Aggregates { landmarks, lum, blurLevel, blurDelta, enabled, ignorePose }
   into { state, message, instantFails } with 400ms MSG_COOLDOWN_MS cooldown matching POC.

  Test requirements: Rely on Task 4 unit tests for the math. Add a minimal component smoke test mounting the hook with a
  stub window.FaceMesh + window.Camera and asserting cameraReady toggles.

  Demo: /__scan-dev route now renders a live camera feed with the FaceMesh tesselation drawn on top, and an on-screen
  readout of the IQA state + message. Pixel-wise parity with POC's mesh rendering in SEARCHING phase.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 7: Port AuraRing — decomposed into SphereBody + AuraCanvas + Eyes + physics hook

  Objective: Replace the existing buggy AuraRing.tsx with a decomposed, typed, demoable mascot.

  Implementation guidance:

  - use-aura-physics.ts — owns the spring-bounce state + emotion kinetics; exposes { eyeState, containerStyle } where
  containerStyle contains the CSS vars (--ex, --ey, --esx, --esy).
  - SphereBody.tsx — absolutely positioned droplet with the exact POC boxShadow interpolated on eyeState.x/y and the two
  aura colors (passed as props).
  - AuraCanvas.tsx — canvas-based 4-layer noise aura; DPR-aware sizing at size * 1.2; identical
  ctx.globalCompositeOperation = 'lighter', identical stroke pattern.
  - Eyes.tsx — 3D-perspective wrapper + dynamic eye shape per expression (normal | senang | sedih | lengkungan);
  includes eye-blink animation.
  - AuraRing.tsx — composes the above, accepts { size, config }. Supports POC's aliases berhasil → senang, gagal →
  sedih.

  Test requirements: Unit test use-aura-physics (deterministic given a seeded RNG — inject Math.random for testability).
  Visual regression via __design-preview page.

  Demo: Four-expression preview grid at /__design-preview matches poc/component/aura-ring.jsx pixel for pixel when
  side-by-side with the standalone POC aura-ring script.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 8: Port IrisShell + CornerFrame + ScrimVignette + SegmentRing

  Objective: Reproduce the iconic square ↔ circle morph and the animated segment ring.

  Implementation guidance:

  - IrisShell.tsx — wraps children; uses framer-motion layout animation with transition: { type: 'spring' } only for the
  circle→square pop-in, but CSS transition for the borderRadius morph (to match POC's cubic-bezier(0.4,0,0.2,1) 760ms).
  Props: phase, iqaState, isConfiguring. Applies .glass-blue, .is-square, .is-circle classes exactly as POC.
  - CornerFrame.tsx — four motion.divs driven by phase (MORPHING: 120×120 r=120, SEARCHING: 50×50 r=18, default: 120×120
  r=18) with POC's spring { stiffness: 260, damping: 26, mass: 0.8 }. Applies corner-frame-ready / corner-frame-warn
  classes from IQA.
  - ScrimVignette.tsx — absolute overlay with inherited border-radius, opacity driven by VIGNETTE_PHASES.
  - SegmentRing.tsx — 60-line SVG ring; props { phase, iqaState, activeSegments: Set<number>, revealedSegments: number
  }. Dynamic color mapping identical to POC (the big if (phase === PHASES.COMPLETE) ... else if (iqaState ===
  IQA.NO_FACE) block).

  Test requirements: Unit test SegmentRing's color function as a pure helper (resolveSegmentPalette(phase, iqaState) → {
  segBase, segReveal, segActive, dynamicFrameColor }), covering every branch.

  Demo: /__scan-dev can drive these components with a phase picker (dropdown:
  LOADING/SEARCHING/MORPHING/SCANNING/CAPTURING/ANALYZING/COMPLETE/FAILED) and IQA picker; transitions match POC timing.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 9: Port overlays, header, progressive log, animated status icons

  Objective: Ship the final display-layer components that sit above IrisShell.

  Implementation guidance:

  - SystemOverlayScreen.tsx — black-blur backdrop + spinner or icon + title + subtitle.
  - AnimatedStatusIcon.tsx — SVG check/X with CSS-driven drawRing + drawTick animations (success=green, error=red;
  drop-shadow filter intact).
  - ChecklistOverlay.tsx — success/spoof/error variants; POC's spring { duration: 0.45, ease: [0.16, 1, 0.3, 1] }.
  - ProgressiveLog.tsx + use-progressive-log.ts — log queue with fade/remove timers (2400ms fade, 4000ms remove for
  ok/info), x-shake animation for warn/err.
  - CaptureFlash.tsx — CAPTURING phase flash: opacity: [0, 1, 0] over 400ms with times: [0, 0.15, 1].
  - ScanningHeader.tsx — logo left + FaceIDGlyph+"Spectre" center + MoreVert settings-trigger right; motion.header with
  opacity animation for busy/preview phases.
  - ModeIndicator.tsx — pill badge with is-register/is-verify classes; mounts with POC's initial/exit/animate variants.

  Test requirements: use-progressive-log is tested with fake timers (assert fade-then-remove sequence; assert shake when
  kind ∈ {warn, err}).

  Demo: /__scan-dev exposes buttons to fire each overlay individually. Visuals match POC stills.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 10: Port dialogs/drawers on shadcn primitives (PreviewDialog, IOSAlertDialog, AnalysisDrawer, ConfigDrawer) +
  RadialChart

  Objective: Reproduce the POC's modal/drawer surfaces using idiomatic shadcn composition, replacing ApexCharts with a
  custom SVG radial.

  Implementation guidance:

  - RadialChart.tsx — SVG <circle> ring with animated stroke-dasharray on value change; matches POC's RadialChartCDN
   colors, size 140, strokeLinecap round, label below.
  - PreviewDialog.tsx — shadcn Dialog with DialogContent wrapped in .glass-strong; shows captured image, Retake + Submit
  buttons. DialogTitle sr-only for accessibility.
  - IOSAlertDialog.tsx — shadcn AlertDialog styled with .ios-alert-box; title + message + N actions
  (cancel/destructive/default). Accepts config: { title, message?, actions: Array<{ label, style, onClick }> }.
  - AnalysisDrawer.tsx — shadcn Drawer (bottom). Renders a header ("FAS Breakdown"), six RadialCharts (one per
  FAS_CLASSES), and a ResultSectionCard with similarity_score when relevant.
  - ConfigDrawer.tsx — shadcn Drawer (bottom). Contains: API-key input (readonly display), ToggleGroup for mode, Switch
   for FAS/require-pose/show-preview, "Apply" button, "Reset" button. Emits an onApply(nextConfig) event.

  Test requirements: Snapshot resolveSegmentPalette + IQA-related helpers through the Task 8/9 tests. Add a render smoke
  test that each drawer opens without throwing (RTL + userEvent).

  Demo: /__scan-dev triggers each dialog/drawer in isolation. Side-by-side with POC, every element (padding, radius,
  backdrop, motion) is indistinguishable.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 11: Port IdentityGate with API-key validation (shadcn Field/Input + zod)

  Objective: Deliver the first screen of the modal — paste an API key, verify it, proceed.

  Implementation guidance:

  - IdentityGate.tsx — identical POC layout (FaceIDGlyph 48px, title "Face Scan", subtitle "Paste API Key yang sudah
  di-generate", then Field+Input styled via .input-mono with placeholder="spk_..."). Validates:
  z.string().startsWith("spk_").min(32).
  - face-client.ts (src/features/face-scan/api/face-client.ts) — POC's client, typed:
    - constructor(apiKey: string) → stores baseUrl, headers X-API-Key.
    - register(externalUserId, imageBase64, fas), authenticate(...), listProfiles(), deleteProfile(id), purgeAll(),
  lookupUser(id), validate() (calls a light endpoint such as listProfiles to confirm 2xx).
    - Uses getBaseUrl() from src/lib/config.ts.

  - On "Mulai Face Scan": runs client.validate(); on success stores the API key in the zustand scan-store and sets
  phase=LOADING + reads external_user_id from the logged-in user (via entities/user/useCurrentUser() → email or id
  fallback); on failure shows an Alert with the POC's copy "API Key tidak valid atau server tidak tersedia".

  Test requirements: RTL test: enter an invalid key → error appears. Enter a valid spk_... key with mocked listProfiles
   returning 200 → onResolved called.

  Demo: /scan (temporarily rendered inline for this task, before Task 13 wraps it in the modal) shows the POC gate with
  API-key input; invalid key surfaces error; valid key advances to a placeholder "Loading scanner…" screen.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 12: Port full ScannerView orchestrator

  Objective: Stitch together every sub-component into the 10-phase state machine and reach visual + behavioral parity
  with POC's ScannerView.

  Implementation guidance:

  - scan-store.ts (zustand) — holds apiKey, externalUserId, mode, fas, requirePose, showPreview, phase, iqaState,
  currentLog, result, redirectIn, draftCapture, drawerOpen, analysisOpen, isConfiguring. Plus actions: setPhase,
  showLog, clearLog, setResult, startRedirect, cancelRedirect, reset, setConfig(partial).
  - ScannerView.tsx — assembles:
    - <ScanningHeader> (with MoreVert → opens ConfigDrawer)
    - <ModeIndicator> in top-28 band when showModeToggle
    - The 400×400 stage with avatarControls (framer useAnimation), containing <IrisShell> (wraps <video> + <canvas> mesh
  + <CornerFrame> + <CaptureFlash> + <ScrimVignette>), a 480-size <AuraRing> sibling during ANALYZING/COMPLETE/FAILED,
  and the <SegmentRing> overlay
    - <ProgressiveLog> docked below stage
    - <PreviewDialog> open when phase === PREVIEW
    - <ResultPanel> at the bottom when terminal
    - <ConfigDrawer> and <AnalysisDrawer> mounted at root of modal

  - Wire POC's refs (phaseRef, iqaStateRef, captureGuardRef, requestEpochRef, inflightRef, revealIntervalRef,
  redirectTimerRef, captureTimerRef, logIdRef, logTimeoutRef, instantFailsRef, lastIqaLogRef, initialModeRef) — keep
  them as refs, not state, to preserve high-frequency mutation semantics.
  - Port scheduleCapture, processCapture, executeApiSubmission, handleReset, handleFaceFrame, handleHeadMove,
  startRedirect, cancelRedirect, showLog, SEARCHING-to-MORPHING-to-SCANNING effect (with 420ms delay before segment
  reveal + 1150ms later phase transition), avatar-controls IQA effect.
  - Ensure initialModeRef + mode-change auto-reset matches POC exactly.

  Test requirements: A deterministic integration test runs ScannerView with mocked FaceMesh/Camera, simulates a READY
  landmarks feed, and asserts phase progression SEARCHING → MORPHING → SCANNING → CAPTURING → ANALYZING → COMPLETE.

  Demo: At /__scan-dev?full=1 the full pipeline runs end-to-end (with stub API responses), reproducing POC flow
  including mode-switch after successful REGISTER, redirect countdown after AUTHENTICATE success, and the analysis
  drawer auto-opening 1.8s after a spoof FAIL.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 13: Mount ScannerModal as a rising overlay on /scan

  Objective: Deliver the iPhone-style modal surface; the user's confirmed Q4 choice.

  Implementation guidance:

  - ScannerModal.tsx — uses shadcn Drawer (vaul-backed, bottom direction) with shouldScaleBackground={false} and
  snapPoints omitted (full-screen snap). Custom DrawerContent class: .glass-strong h-[100dvh]
  rounded-t-[var(--radius-2xl)] with safe-area padding. Includes DrawerTitle sr-only.
  - On mount, renders ScannerView inside. On close (onOpenChange=false), it navigates back (navigate(-1) or home
  fallback) and clears scan-store.
  - Routing: in src/app/router.tsx (or main.tsx), mount <Route path="/scan" element={<ScannerModal />} /> as a sibling
   to the Layout route but marked as an overlay so the Layout renders underneath (using a nested <Outlet /> +
  <ScannerModal> rendered by a matching route). Simpler alternative: keep Layout's <Outlet /> at Dashboard/other, and
  render <ScannerModal> conditionally when useMatch('/scan') is truthy — with a ref back to the referring URL for
  close-to-return.
  - AppHeader's scan button: navigate('/scan'). Supports ESC to dismiss and swipe-down on mobile (vaul built-in).
  - If the user lands on /scan directly (deep link), fall back to /dashboard when closed.

  Test requirements: RTL test: render Router with /dashboard, click the header scan button → URL becomes /scan, modal
  visible, ESC → URL becomes /dashboard, modal gone.

  Demo: From any protected page, clicking the scan icon in the header rises the glass modal from the bottom, blurring
  the page underneath. The modal contains IdentityGate → verify → ScannerView → full POC flow. Closing returns to the
  exact previous page.

  ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

  Task 14: Parity verification, cleanup, lint/build/test green, documentation

  Objective: Tighten the loop — prove the new flow is indistinguishable from POC and the repo is clean.

  Implementation guidance:

  - Open /poc/ and /scan side-by-side in two browser windows. Walk through every phase. Verify: background gradient,
  font rendering, iris-shell timing (760ms), corner-frame sizes/radii, aura rendering, eye expressions, segment color
  palette per phase, log entry fade timing, preview dialog motion, analysis drawer open timing (1.8s after spoof fail),
  mode indicator pill, iOS alert proportions, redirect countdown, register→authenticate auto-switch after 2.8s.
  - Delete the buggy superseded files in src/features/face-scan/ui/ (original ScannerView.tsx, AuraRing.tsx,
  IdentityGate.tsx, lib/hooks.ts, lib/iqa.ts, lib/utils.ts) if any remnants remain.
  - Remove the temporary routes /__design-preview and /__scan-dev.
  - Tighten src/features/face-scan/index.ts to export only the public API: ScannerModal, ScannerView, IdentityGate,
  FaceApiClient, type ScanResult, useScanStore selectors.
  - Update eslint.config.js to enforce no-warning-comments, no-console, @typescript-eslint/no-explicit-any,
  @typescript-eslint/consistent-type-imports. Fix any violations.
  - Run npm run lint (zero warnings), npm run build (bundles clean), npm test (all green), npm run dev (no console
  errors during the full /scan flow).

  Test requirements: The existing test suite stays green. Add a single end-to-end smoke test using RTL + mocked camera
  that exercises the /scan route: open → paste key → verify → (simulated READY frames) → CAPTURING → ANALYZING →
  COMPLETE.

  Demo: A clean npm run build && npm run lint && npm test run; POC at /poc/ still works untouched; /scan in the new app
  is visually and behaviorally identical; every other page (Login, Dashboard, Applications, ApiKeys, etc.) now carries
  the POC identity consistently.