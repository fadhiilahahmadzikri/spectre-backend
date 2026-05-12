export { ScannerModal } from "./ui/ScannerModal";
export { ScannerView } from "./ui/ScannerView";
export { IdentityGate, type IdentityGateResolved } from "./ui/IdentityGate";
export { FaceApiClient, type FaceApiResponse, type FaceProfile } from "./api/face-client";
export { useScanSession } from "./model/scan-store";
export type {
  Phase,
  IqaState,
  ScanMode,
  ScanResult,
  ResultVerdict,
  AuraConfig,
  AuraExpression,
} from "./model/types";
