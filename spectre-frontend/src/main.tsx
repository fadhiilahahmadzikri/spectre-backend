import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Existing app pages
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Applications } from "./pages/Applications";
import { ApiKeys } from "./pages/ApiKeys";
import { AdminHealth } from "./pages/AdminHealth";
import { AdminMonitoring } from "./pages/AdminMonitoring";
import { Layout } from "./components/Layout";
import { OAuthCallback } from "./pages/OAuthCallback";
import { ProtectedRoute } from "./app/guards/ProtectedRoute";
import { GuestRoute } from "./app/guards/GuestRoute";
import { IdleLogoutWatcher } from "./app/providers/IdleLogoutWatcher";
import { FaceScanRoute } from "./app/guards/FaceScanRoute";
import { IosAlertProvider } from "./app/providers/IosAlertProvider";
import { OrchestrationOverlay } from "@/shared/ui/OrchestrationOverlay";
import { Toaster } from "@/components/ui/sonner";

// Landing & public pages
import LandingPage from "./pages/LandingPage";
import ApiReference from "./pages/ApiReference";
import Sdks from "./pages/Sdks";
import Changelog from "./pages/Changelog";

// Docs layout
import DocsLayout from "./components/layout/DocsLayout";
import DocsShellLayout from "./components/layout/DocsShellLayout";

// Docs — getting started
import Introduction from "./pages/docs/getting-started/Introduction";
import Quickstart from "./pages/docs/getting-started/Quickstart";
import Authentication from "./pages/docs/getting-started/Authentication";
import RateLimits from "./pages/docs/getting-started/RateLimits";

// Docs — face operations
import RegisterFace from "./pages/docs/face-operations/RegisterFace";
import AuthenticateFace from "./pages/docs/face-operations/AuthenticateFace";
import ReplaceFace from "./pages/docs/face-operations/ReplaceFace";
import DeleteFace from "./pages/docs/face-operations/DeleteFace";

// Docs — sessions
import GetSession from "./pages/docs/sessions/GetSession";

// Docs — tenant
import DocsApiKeys from "./pages/docs/tenant/ApiKeys";

// Docs — reference
import ErrorCodes from "./pages/docs/reference/ErrorCodes";
import ResponseSchema from "./pages/docs/reference/ResponseSchema";
import Security from "./pages/docs/reference/Security";

import { ThemeProvider } from "next-themes";
import "./index.css";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={qc}>
      <IosAlertProvider>
        <BrowserRouter>
          <IdleLogoutWatcher />
          <Routes>
            {/* Public — landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Docs shell (topbar, no sidebar) */}
            <Route element={<DocsShellLayout />}>
              <Route path="/api-reference" element={<ApiReference />} />
              <Route path="/sdks" element={<Sdks />} />
              <Route path="/changelog" element={<Changelog />} />
            </Route>

            {/* Auth */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />

            {/* Docs */}
            <Route path="/docs" element={<DocsLayout />}>
              <Route index element={<Introduction />} />
              <Route path="introduction" element={<Introduction />} />
              <Route path="quickstart" element={<Quickstart />} />
              <Route path="authentication" element={<Authentication />} />
              <Route path="rate-limits" element={<RateLimits />} />
              <Route path="register-face" element={<RegisterFace />} />
              <Route path="authenticate-face" element={<AuthenticateFace />} />
              <Route path="replace-face" element={<ReplaceFace />} />
              <Route path="delete-face" element={<DeleteFace />} />
              <Route path="get-session" element={<GetSession />} />
              <Route path="api-keys" element={<DocsApiKeys />} />
              <Route path="error-codes" element={<ErrorCodes />} />
              <Route path="response-schema" element={<ResponseSchema />} />
              <Route path="security" element={<Security />} />
            </Route>

            {/* Protected app — dashboard moved to /app */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="admin/health" element={<AdminHealth />} />
              <Route path="applications" element={<Applications />} />
              <Route path="applications/:appId/keys" element={<ApiKeys />} />
              <Route path="admin/monitoring" element={<AdminMonitoring />} />
              <Route
                path="scan"
                element={
                  <Suspense fallback={null}>
                    <FaceScanRoute />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
          <Toaster />
          <OrchestrationOverlay />
        </BrowserRouter>
      </IosAlertProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </>,
);
