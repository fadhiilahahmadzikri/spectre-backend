import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FaceScan } from "./pages/FaceScan";
import "./index.css";

// Keep the QueryClient setup
const qc = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

// Set up the router to use the actual page component
const router = createBrowserRouter([
  {
    path: "/",
    element: <FaceScan />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={qc}>
    {/* This outer div provides the dark background */}
    <div className="min-h-screen bg-black flex items-center justify-center">
      <RouterProvider router={router} />
    </div>
  </QueryClientProvider>
);
