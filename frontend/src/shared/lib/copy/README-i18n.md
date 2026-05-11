# i18n boundary

Spectre uses a deliberate language split instead of a runtime i18n framework.

## The rule

| Surface | Language | Catalog |
|---|---|---|
| Face-scan flow (end-user) | **Indonesian** | `scan.ts` |
| Dashboard, auth, admin, layout chrome | **English** | `admin.ts` |

The split is by *audience*, not by *route*:

- The scanner serves the end-user performing the face scan. Indonesian, simple, direct.
- Everything else (dashboard, applications, API keys, health, auth forms, OAuth callback, verify-email, layout, toasts spawned from admin actions) serves the developer operating the platform. English.

`IosAlertProvider` defaults are **English** because all existing callers are admin surfaces. Any scanner-side consumer must pass Indonesian labels explicitly.

## Adding a new string

1. Pick the catalog based on the audience rule above.
2. Add a key to the appropriate nested `as const` object so call sites get literal types.
3. If the string has a runtime value, export a function rather than a template:

   ```ts
   // wrong: runtime interpolation, no type for the shape
   removed: "Application {name} removed"

   // right: typed function, IDE catches wrong call signature
   removed: (name: string) => `Application "${name}" removed`
   ```

4. Import from `@/shared/lib/copy`:

   ```ts
   import { scan, admin } from "@/shared/lib/copy";

   <h1>{scan.identityGate.title}</h1>
   notify.success(admin.applications.created(name));
   ```

## What does NOT belong here

- Server-returned error messages (rendered as-is; may be in English regardless).
- Static accessibility-only labels that are never displayed (keep those where they're used).
- Developer-facing console errors or logger messages (not i18n-scoped).

## Why not a full i18n framework?

The app has two audiences with fixed language assignments. Adding `react-intl` / `i18next` would buy runtime flexibility the product doesn't need and cost bundle size + indirection. When (if) the platform needs full locale switching, migrate both catalogs to the chosen framework — the nested shape makes that mechanical.
