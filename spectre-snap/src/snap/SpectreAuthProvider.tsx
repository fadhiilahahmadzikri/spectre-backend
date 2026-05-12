import { createContext, useContext, type ReactNode } from "react";
import type { SpectreProviderConfig } from "./types";

const SpectreContext = createContext<SpectreProviderConfig>({});

/**
 * Optional context provider for global Spectre configuration.
 *
 * Wrapping your app (or a subtree) in `SpectreAuthProvider` lets all nested
 * `<SpectreAuth />` and `<SpectreAuthModal />` components inherit shared
 * defaults — API key, base URL, theme, and locale — without repeating them
 * on every instance.
 *
 * Props passed directly to a `<SpectreAuth />` component always override the
 * provider's defaults.
 *
 * @example
 * ```tsx
 * <SpectreAuthProvider apiKey="spk_..." baseUrl="https://my.api.com">
 *   <SpectreAuth userId="user_123" onSuccess={handleSuccess} />
 * </SpectreAuthProvider>
 * ```
 */
export function SpectreAuthProvider({
  children,
  ...config
}: SpectreProviderConfig & { children: ReactNode }) {
  return (
    <SpectreContext.Provider value={config}>{children}</SpectreContext.Provider>
  );
}

/**
 * Internal hook to read the provider config.
 * Returns an empty object if no provider is in the tree.
 */
export function useSpectreConfig(): SpectreProviderConfig {
  return useContext(SpectreContext);
}
