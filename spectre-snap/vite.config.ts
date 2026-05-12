import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";

  return {
    plugins: [
      tailwindcss(),
      ...(isLib
        ? [
            dts({
              tsconfigPath: "./tsconfig.build.json",
              rollupTypes: true,
              insertTypesEntry: true,
            }),
          ]
        : []),
    ],
    esbuild: { jsx: "automatic", jsxImportSource: "react" },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      port: 5174,
    },
    ...(isLib
      ? {
          build: {
            lib: {
              entry: fileURLToPath(
                new URL("./src/index.ts", import.meta.url),
              ),
              name: "SpectreSnap",
              formats: ["es", "cjs"] as const,
              fileName: (format: string) =>
                format === "es"
                  ? "spectre-snap.js"
                  : "spectre-snap.cjs",
            },
            rollupOptions: {
              external: ["react", "react-dom", "react/jsx-runtime"],
              output: {
                globals: {
                  react: "React",
                  "react-dom": "ReactDOM",
                  "react/jsx-runtime": "jsxRuntime",
                },
              },
            },
            cssCodeSplit: false,
            sourcemap: true,
            minify: "esbuild" as const,
          },
        }
      : {}),
  };
});
