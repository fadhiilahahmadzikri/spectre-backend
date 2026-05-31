import { describe, it, expect } from "vitest";
import { scan, admin } from "../index";
import type { ScanCopy, AdminCopy } from "../index";

describe("copy catalog", () => {
  it("scan catalog defines identityGate title in Indonesian", () => {
    expect(scan.identityGate.title).toBe("Face Scan");
    expect(scan.identityGate.start).toBe("Mulai Face Scan");
  });

  it("admin catalog defines applications copy in English", () => {
    expect(admin.applications.title).toBe("Applications");
    expect(admin.applications.newApp).toBe("New application");
  });

  it("supports typed interpolation functions", () => {
    expect(scan.result.redirecting(3)).toBe("Mengalihkan 3s");
    expect(admin.applications.created("Foo")).toBe('Application "Foo" created');
  });

  it("catalogs are typed via exported interfaces", () => {
    // Type-level assertions — if the catalog drifts these fail at tsc.
    const _s: ScanCopy = scan;
    const _a: AdminCopy = admin;
    expect(_s.identityGate.title).toBeDefined();
    expect(_a.applications.title).toBeDefined();
  });
});
