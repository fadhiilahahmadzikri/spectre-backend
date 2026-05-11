/**
 * Scanner-surface copy (Indonesian).
 *
 * This catalog owns every end-user string displayed during the face-scan flow:
 * IdentityGate, the scanner HUD, overlays, dialogs (PreviewDialog, AnalysisDrawer,
 * ConfigDrawer), ResultPanel, and the orchestrator's live log events.
 *
 * Language boundary: Indonesian for scanner (end-user), English for admin/dev.
 * See README-i18n.md for the full boundary contract.
 *
 * Interpolation: string literals for static copy; functions `(x) => \`...${x}\`` for
 * dynamic copy so call sites keep literal type safety.
 */

export const scan = {
  identityGate: {
    title: "Face Scan",
    placeholder: "Paste API Key yang sudah di-generate",
    start: "Mulai Face Scan",
    verifying: "Memverifikasi...",
    cancel: "Batal",
    invalidKeyServer: "API Key tidak valid atau server tidak tersedia",
    invalidKey: "Kunci tidak valid",
    tooShort: "API key too short",
  },
  preview: {
    title: "Review Tangkapan",
    subtitle: "Konfirmasi sebelum kirim",
    submit: "Kirim ke Server",
    retake: "Ambil Ulang",
  },
  result: {
    rescan: "Pindai Ulang",
    redirecting: (n: number) => `Mengalihkan ${n}s`,
  },
  analysis: {
    title: "Analisis Liveness",
    subtitle: "Rincian Kategori Spoofing",
    aggregateSummary: "Ringkasan Aggregat",
    classDistribution: "Distribusi 6 Kelas",
    live: "Live (Wajah Asli)",
    spoof: "Spoof (Serangan)",
    realPerson: "Real Person",
    mask: "Mask",
    mannequin: "Mannequin",
    paperCut: "Paper Cut",
    printed: "Printed",
    screen: "Screen",
    empty: "Belum ada data analisis untuk ditampilkan.",
  },
  config: {
    applyChanges: "Terapkan perubahan",
    resetScanner: "Reset pemindai",
    livenessCheck: "Deteksi keaslian",
    livenessCheckDescription: "Verifikasi tangkapan ke model anti-spoofing server.",
    requireHeadRotation: "Wajibkan rotasi kepala",
    requireHeadRotationDescription:
      "Minta pengguna memutar kepala sebelum pengambilan.",
    showPreview: "Tampilkan pratinjau",
    showPreviewDescription:
      "Tampilkan dialog pratinjau sebelum mengirim ke server.",
  },
  logs: {
    // Orchestrator submission flow
    encrypting: "Enkripsi & Kompresi data...",
    imageCaptured: "Gambar diambil",
    registeringToApi: "Mendaftarkan wajah ke API...",
    verifyingToApi: "Memverifikasi identitas ke API...",
    authSuccess: "Autentikasi Berhasil",
    registerSuccess: "Pendaftaran berhasil",
    identityVerified: "Identitas terverifikasi",
    enteringVerifyMode: "Masuk ke mode Verifikasi",
    preparingBiometric: "Menyiapkan data biometrik...",
    processingRawFrame: "Memproses frame mentah...",
    frameProcessingFailed: "Gagal memproses frame video",

    // IQA / posture feedback
    processingFrameHold: "Memproses bingkai... Tahan posisi wajah Anda",
    cameraFocusing: "Kamera sedang fokus... Tahan posisi",
    tooClose: "Terlalu dekat dengan kamera... Mundur sedikit",
    poorLighting: "Pencahayaan kurang baik...",
    waitingForPosition: "Menunggu posisi ideal...",
    rotateHead: "Putar kepala Anda perlahan",
    faceDetected: "Wajah terdeteksi",
    faceLost: "Wajah hilang dari bingkai",

    // Result / error states
    spoofing: (msg: string) => `Spoofing: ${msg}`,
    mismatch: (sim: string) => `Tidak cocok (${sim})`,
    spoofDetected: "Spoofing Terdeteksi",
    unknownIdentity: "Tidak Dikenali",
    verificationFailed: "Verifikasi Gagal",
    processingBiometric: "Memproses data biometrik...",
    identityVerifiedShort: "Identitas Terverifikasi",

    // Status labels
    spoofShort: "SPOOF",
    mismatchShort: "TIDAK COCOK",
    errorShort: "ERROR",
    genericError: "Terjadi kesalahan",
    apiError: (code: string | number) => `API Server: ${code}`,
  },
} as const;

export type ScanCopy = typeof scan;
