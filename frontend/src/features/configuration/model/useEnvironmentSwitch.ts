import { useQueryClient } from "@tanstack/react-query";
import { useOrchestrationStore } from "@/lib/store";
import { ENV, getBaseUrl, setBaseUrl, type EnvName } from "@/lib/config";
import { api } from "@/lib/api";
import { notify } from "@/shared/lib/notify";
import { admin } from "@/shared/lib/copy";

async function waitForReadiness(maxAttempts = 30, intervalMs = 2000): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const h = await api.getHealth();
      if (h.status === "healthy") return;
    } catch {
      /* keep polling; readiness is eventually-consistent */
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Readiness timeout");
}

/**
 * useEnvironmentSwitch — the single entry point for changing the API target.
 * Freezes the UI, cancels in-flight queries, flips the base URL, polls
 * `/health` until the new target is ready, then invalidates the cache.
 * On failure, rolls back to the previous URL and toasts the error.
 */
export function useEnvironmentSwitch() {
  const qc = useQueryClient();
  const { setFrozen, addLog, isSyncing, setSyncing } = useOrchestrationStore();

  async function switchTo(target: EnvName) {
    if (isSyncing) return;
    const previous = getBaseUrl();
    const nextUrl = target === "hf" ? ENV.HF_SPACES : ENV.LOCAL;
    if (nextUrl === previous) return;

    setSyncing(true);
    setFrozen(true, admin.orchestration.synchronizingEnvironment);
    addLog(`Switching API to ${target}`, "info");
    try {
      await qc.cancelQueries();
      setBaseUrl(nextUrl);
      await waitForReadiness();
      await qc.invalidateQueries();
      addLog(`API synchronized to ${target}`, "success");
      notify.success(admin.orchestration.envSwitched(target));
    } catch (err) {
      setBaseUrl(previous);
      addLog(`Rollback to ${previous}`, "error");
      notify.error(admin.orchestration.envSwitchFailed, {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setFrozen(false);
      setSyncing(false);
    }
  }

  return { switchTo, isSyncing };
}
