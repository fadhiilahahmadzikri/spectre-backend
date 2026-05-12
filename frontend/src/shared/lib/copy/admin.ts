/**
 * Admin/dashboard/auth copy (English).
 *
 * This catalog owns every string shown outside the scanner flow: auth forms,
 * dashboard, Applications / API keys CRUD, AdminHealth, ConfigDialog, layout
 * chrome (AppHeader, MobileMenu, EnvToggle), OAuth callback, orchestration
 * overlay, and verify-email.
 *
 * Language boundary: English for admin/dev, Indonesian for scanner.
 * See README-i18n.md for the full boundary contract.
 *
 * Interpolation: use functions `(x) => \`...${x}\`` for dynamic copy; static
 * strings stay as string literals so call sites keep literal type safety.
 */

export const admin = {
  common: {
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    save: "Save",
    close: "Close",
  },
  applications: {
    title: "Applications",
    subtitle: "Manage your registered apps.",
    newApp: "New application",
    emptyTitle: "No applications yet",
    emptyDescription:
      "Create your first application to start issuing API keys and running face scans.",
    createApp: "Create application",
    createAppLoading: "Creating…",
    loading: "Loading applications...",
    rename: "Rename",
    apiKeys: "API keys",
    deleteDialogTitle: "Delete application?",
    deleteDialogBody: (name: string) =>
      `"${name}" and all its API keys will be removed.`,

    // Mutation outcomes (consumed by useRealisticMutation)
    created: (name: string) => `Application "${name}" created`,
    createFailed: "Failed to create application",
    updated: "Application updated",
    updateFailed: "Failed to update application",
    removed: "Application removed",
    removeFailed: "Failed to remove application",

    // Form copy for create dialog
    createDialogDescription:
      "Give your app a memorable name. You can issue API keys for it after creating.",
    namePlaceholder: "e.g. Spectre Production",
  },
  apiKeys: {
    title: "API keys",
    subtitleBackLink: "Applications",
    subtitleContext: (id: string) => `Application · ${id}`,
    generate: "Generate key",
    generateLoading: "Generating…",
    loading: "Loading API keys...",
    emptyTitle: "No API keys yet",
    emptyDescription:
      "Generate your first key to start calling the Spectre face verification API.",
    revoked: "API key revoked",
    revokedFailed: "Failed to revoke API key",
    revokeDialogTitle: "Revoke API key?",
    revokeDialogBody:
      "Applications using this key will lose access immediately.",
    revoke: "Revoke",
    deleted: "API key deleted",
    deleteFailed: "Failed to delete API key",
    deleteDialogTitle: "Delete API key permanently?",
    deleteDialogBody:
      "The key record will be removed from the database. This cannot be undone and the audit record for this key will be lost.",
    delete: "Delete",
    prefixCopied: "Prefix copied",
    copyPrefix: "Copy prefix",
    copied: "Copied",
    statusActive: "active",
    statusRevoked: "revoked",

    // Generate dialog (success state)
    dialogGeneratedTitle: "Key generated",
    dialogGeneratedDescription:
      "This key is shown only once. Copy it now and store it securely.",
    dialogGenerateTitle: "Generate new key",
    dialogGenerateDescription:
      "A fresh API key will be created for this application.",
    copyWarning: "Copy now — this will not be shown again",
    copyKey: "Copy key",
    done: "Done",
    newKeyToast: "New API key generated",
    copiedToast: "Copied to clipboard",

    // Mutation outcomes
    generated: "API key generated",
    generateFailed: "Failed to generate API key",
  },
  configDialog: {
    title: "System Configuration",
    description: "Manage operational parameters. Changes apply immediately.",
    saveChanges: "Save changes",
    saving: "Saving…",
    noChanges: "No changes to save.",
    saved: "Configuration saved",
    savedDescription: "Changes applied immediately.",
    saveFailed: "Save failed",
    unknownError: "Unknown error",
    loadFailedTitle: "Unable to load configuration",
    loadFailedDescription:
      "Backend is not reachable or configuration has not been seeded yet.",
  },
  health: {
    title: "Admin Health",
    heading: "Infrastructure Control",
    refreshing: "Refreshing...",
    refresh: "Refresh",
    refreshingStatus: "Refreshing infrastructure status...",
    statusUpdated: "Health status updated.",
    switchingApi: "Switching API environment...",
    apiSynchronized: "API environment synchronized.",
    switchingApiShort: "Switching API...",
    databaseFailover: "Database failover...",
    orchestratingFailover: "Orchestrating database failover...",
    dbTransitioned: (id: string) => `Database transitioned to ${id}.`,
    switchFailed: (err: string) => `Switch failed: ${err}`,
    failoverFailed: (err: string) => `Failover failed: ${err}`,

    keepAliveHeartbeats: "Keep-Alive Heartbeats",
    manage: "Manage",
    colTimestamp: "Timestamp",
    colSource: "Source",
    colTarget: "Target",
    colStatus: "Status",
    noHeartbeats: "No heartbeat records",
    noHeartbeatsDescription:
      "Heartbeats will appear once the keep-alive engine runs.",

    systemStatus: "System Status",
    hfSpace: "Hugging Face Space",
    storageLayer: "Storage Layer",
    activeDatabase: "Active Database",
    inferenceEngine: "Inference Engine",
    mlModel: "ML Model",

    // Switcher panels
    apiTarget: "API Target",
    apiTargetDescription: "Route requests to backend.",
    database: "Database",
    databaseDescription: "Switch active storage layer.",
    envLocal: "Local Development",
    envHf: "Hugging Face Spaces",
    dbSupabase: "Supabase (Session Pooler)",
    dbAlpine: "Alpine PostgreSQL",
  },
  auth: {
    signInTitle: "Sign in to Spectre",
    signInSubtitle: "Enter your credentials to continue.",
    signingIn: "Signing in…",
    signIn: "Sign in",
    continueWithGoogle: "Continue with Google",
    noAccount: "No account?",
    createOne: "Create one",
    signUpTitle: "Create your account",
    signUpSubtitle: "Join Spectre in under a minute.",
    email: "Email",
    password: "Password",
    displayName: "Display name",
    passwordHintMin: "Password (min 8 chars)",
    creating: "Creating…",
    createAccount: "Create account",
    haveAccount: "Already have an account?",
    signedInToast: "Signed in",
    accountCreatedToast: "Account created",
    otpHint: "Check your inbox for the OTP.",
    switchToSignUp: "Switch to sign up",
    switchToSignIn: "Switch to sign in",
    signingInAria: "Signing in",
    creatingAccountAria: "Creating account",
  },
  oauth: {
    completing: "Completing sign-in...",
    failedTitle: "Sign-in failed",
    failedDescription:
      "We couldn't complete your sign-in. Please try again.",
    returnToSignIn: "Return to sign-in",
  },
  layout: {
    dashboard: "Dashboard",
    applications: "Applications",
    health: "Health",
    navigation: "Navigation menu",
    navigationMain: "Main application navigation",
    faceScan: "Face scan",
    configuration: "Configuration",
    logOut: "Log out",
    systemConfiguration: "System configuration",
    startFaceScan: "Start face scan",
    openMenu: "Open menu",
    envSwitched: (label: string) => `Switched to ${label}`,
    envSwitchTo: (label: string) => `Switch to ${label} environment`,
    envLocal: "Local",
    envHf: "HF Space",
  },
  orchestration: {
    synchronizingEnvironment: "Synchronizing environment",
    waitingForReadiness: "Waiting for readiness",
    envSwitched: (target: string) => `Switched to ${target} environment`,
    envSwitchFailed: "Failed to switch API environment",
    dbSwitched: (target: string) => `Switched to ${target} database`,
    dbSwitchFailed: "Failed to switch database",
  },
  dashboard: {
    welcome: (name: string) => `Welcome back, ${name}.`,
    title: "Dashboard",
    startFaceScan: "Start face scan",
    startFaceScanDescription: "Paste an API key and verify identity.",
    applicationsCard: "Applications",
    applicationsCardDescription: "Manage your registered apps.",
    apiReferenceCard: "API reference",
    apiReferenceDescription: "Explore endpoints & authentication.",
    documentation: "Documentation",
    docsSubtitle:
      "REST API reference for face registration and authentication.",
    swaggerTitle: "Swagger UI",
    swaggerDescription: "Interactive API explorer",
    redocTitle: "ReDoc",
    redocDescription: "Clean API documentation",
    apiSpecTitle: "API Spec (Hosted)",
    apiSpecDescription: "Full integration reference",
    postmanTitle: "Postman Collection",
    postmanDescription: "30 requests · Public workspace",
  },
} as const;

export type AdminCopy = typeof admin;
