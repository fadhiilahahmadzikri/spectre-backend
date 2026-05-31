import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useCopyToClipboard — encapsulates the "Copy → ✓ Copied (2s) → Copy" cycle
 * so call sites don't have to hand-roll setTimeout + state. The timer is
 * cleared on unmount to avoid React warnings from setState after unmount.
 */
export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setCopied(false), resetMs);
        return true;
      } catch {
        return false;
      }
    },
    [resetMs],
  );

  return { copied, copy };
}
