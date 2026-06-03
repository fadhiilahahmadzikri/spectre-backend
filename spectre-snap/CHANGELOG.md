# Changelog

## Unreleased

- Added `SpectreError`, `SpectreErrorCode`, and normalized SDK error envelope exports.
- Allowed `SpectreAuth` and `SpectreAuthModal` to omit `apiKey` when `SpectreAuthProvider` supplies it.
- Wired `baseUrl`, `fas`, `requirePose`, `showPreview`, and `redirectDelay` into each mounted scanner instance without shared runtime URL state.
- Stopped persisting full API keys as scan-mode cache keys.
- Added jsdom Vitest setup and a package `test` script.
- Scoped package tokens and removed document-level `html`, `body`, and `#root` styling from published CSS.
