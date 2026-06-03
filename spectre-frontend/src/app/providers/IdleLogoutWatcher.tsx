import { useIdleLogout } from "@/app/hooks/useIdleLogout";

export function IdleLogoutWatcher() {
  useIdleLogout();
  return null;
}
