# spectre-snap E2E Test

Isolated test namespace untuk verify package download dan usage end-to-end.

## Setup

```bash
npm install
```

## Test

```bash
# Test ESM import
npm run test:import

# Test CJS import
npm run test:cjs
```

## What's Tested

- ✅ Package download from npm
- ✅ ESM export integrity
- ✅ CJS export integrity (dual-build)
- ✅ Type declarations availability
- ✅ Core component exports (SpectreAuthProvider, SpectreAuthModal, etc.)
- ✅ Error handling exports (SpectreError, SpectreErrorCode)
- ✅ CSS export path

This validates the hardening done in feature/industrial-sdk-foundation-hardening:
- Proper exports configuration
- CJS/ESM dual support
- No errors during install and import
