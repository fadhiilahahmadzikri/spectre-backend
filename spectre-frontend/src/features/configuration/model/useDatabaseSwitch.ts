import { useQueryClient } from "@tanstack/react-query";
import { useOrchestrationStore } from "@/lib/store";
import { api } from "@/lib/api";
import { notify } from "@/shared/lib/notify";
import { admin } from "@/shared/lib/copy";

async function waitForReadiness(maxAttempts = 30, intervalMs = 2000): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const h = await api.getHealth();
      if (h.status === "healthy") return;
    } catch {
      /* keep polling */
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Readiness timeout");
}

/**
 * useDatabaseSwitch — initiates a database failover via
 * `POST /admin/config/db`. Same freeze/readiness/rollback contract as the
 * environment switch hook, but with no URL rollback — just a cache refresh.
 */
export function useDatabaseSwitch() {
  const qc = useQueryClient();
  const { setFrozen, addLog, isSyncing, setSyncing } = useOrchestrationStore();

  async function switchTo(target: string) {
    if (isSyncing) return;

    setSyncing(true);
    setFrozen(true, admin.orchestration.synchronizingEnvironment);
    addLog(`Initiating database failover → ${target}`, "info");

    try {
      await qc.cancelQueries();
      await api.switchDatabase(target);
      await waitForReadiness();
      await qc.invalidateQueries();
      addLog(`Database transitioned to ${target}`, "success");
      notify.success(admin.orchestration.dbSwitched(target));
    } catch (err) {
      addLog(`Database failover failed`, "error");
      notify.error(admin.orchestration.dbSwitchFailed, {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setFrozen(false);
      setSyncing(false);
    }
  }

  return { switchTo, isSyncing };
}
