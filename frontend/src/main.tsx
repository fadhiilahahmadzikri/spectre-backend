import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { VerifyEmail } from "./pages/VerifyEmail";
import { Dashboard } from "./pages/Dashboard";
import { Applications } from "./pages/Applications";
import { ApiKeys } from "./pages/ApiKeys";
import { AdminHealth } from "./pages/AdminHealth";
import { Layout } from "./components/Layout";
import { OAuthCallback } from "./pages/OAuthCallback";
import { ProtectedRoute } from "./app/guards/ProtectedRoute";
import { FaceScanRoute } from "./app/guards/FaceScanRoute";
import { IosAlertProvider } from "./app/providers/IosAlertProvider";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";

const qc = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <IosAlertProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route
              path="/"
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
        </BrowserRouter>
      </IosAlertProvider>
    </QueryClientProvider>
  </StrictMode>,
);
