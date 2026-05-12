import { lazy } from "react";

export const FaceScanRoute = lazy(() =>
  import("@/pages/FaceScan").then((m) => ({ default: m.FaceScan })),
);
