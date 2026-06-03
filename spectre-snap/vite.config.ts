import { defineConfig } from "vite";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";

const DECLARATION_EXTENSIONS = [".d.ts", ".d.cts"];
const EXPLICIT_SPECIFIER_EXTENSION =
  /\.(?:cjs|cts|css|d\.cts|d\.mts|d\.ts|json|js|mjs|mts|ts)$/;

function withJsExtension(specifier: string): string {
  if (!specifier.startsWith(".") || EXPLICIT_SPECIFIER_EXTENSION.test(specifier)) {
    return specifier;
  }
  return `${specifier}.js`;
}

function appendJsExtensions(source: string): string {
  return source
    .replace(
      /(from\s+["'])(\.[^"']+)(["'])/g,
      (_match, prefix: string, specifier: string, suffix: string) =>
        `${prefix}${withJsExtension(specifier)}${suffix}`,
    )
    .replace(
      /(import\(\s*["'])(\.[^"']+)(["']\s*\))/g,
      (_match, prefix: string, specifier: string, suffix: string) =>
        `${prefix}${withJsExtension(specifier)}${suffix}`,
    );
}

function isDeclarationFile(path: string): boolean {
  return DECLARATION_EXTENSIONS.some((extension) => path.endsWith(extension));
}

function rewriteDeclarationSpecifiers(directory: string) {
  for (const entry of readdirSync(directory)) {
    const path = `${directory}/${entry}`;
    if (statSync(path).isDirectory()) {
      rewriteDeclarationSpecifiers(path);
      continue;
    }
    if (!isDeclarationFile(path)) continue;
    writeFileSync(path, appendJsExtensions(readFileSync(path, "utf8")));
  }
}

function copyCjsDeclarationEntry(distDir: string) {
  const dtsPath = `${distDir}/index.d.ts`;
  const ctsPath = `${distDir}/index.d.cts`;
  if (!existsSync(dtsPath)) return;

  const cts = readFileSync(dtsPath, "utf8").replace(
    "sourceMappingURL=index.d.ts.map",
    "sourceMappingURL=index.d.cts.map",
  );
  writeFileSync(ctsPath, cts);

  const dtsMapPath = `${distDir}/index.d.ts.map`;
  if (!existsSync(dtsMapPath)) return;

  const ctsMapPath = `${distDir}/index.d.cts.map`;
  const map = JSON.parse(readFileSync(dtsMapPath, "utf8")) as { file?: string };
  map.file = "index.d.cts";
  writeFileSync(ctsMapPath, JSON.stringify(map));
}

function writeCssDeclaration(distDir: string) {
  writeFileSync(
    `${distDir}/style.css.d.ts`,
    "declare const stylesheet: string;\nexport default stylesheet;\n",
  );
}

function finalizeDeclarations() {
  const distDir = fileURLToPath(new URL("./dist", import.meta.url));
  copyCjsDeclarationEntry(distDir);
  rewriteDeclarationSpecifiers(distDir);
  writeCssDeclaration(distDir);
}

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
              afterBuild: finalizeDeclarations,
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
