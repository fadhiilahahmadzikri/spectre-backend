import { useEffect, useState } from "react";

export function useScriptLoader(sources: readonly string[]): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      for (const src of sources) {
        if (document.querySelector(`script[src="${src}"]`)) continue;
        await new Promise<void>((resolve, reject) => {
          const el = document.createElement("script");
          el.src = src;
          el.crossOrigin = "anonymous";
          el.onload = () => resolve();
          el.onerror = reject;
          document.head.appendChild(el);
        });
        if (cancelled) return;
      }
      if (!cancelled) setLoaded(true);
    };

    loadAll().catch(() => {
      /* errors are surfaced via parent state machines */
    });

    return () => {
      cancelled = true;
    };
  }, [sources]);

  return loaded;
}
