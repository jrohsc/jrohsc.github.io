import { defineConfig } from "vite";
import { rmSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
export default defineConfig({
  plugins: [
    {
      name: "clean-generated-assets",
      apply: "build",
      buildStart() {
        rmSync(
          fileURLToPath(new URL("../interview-prep/assets", import.meta.url)),
          { recursive: true, force: true },
        );
      },
    },
    {
      name: "serve-study-data",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const match = req.url?.match(
            /^\/(?:interview-prep\/)?data\/(curriculum|questions|companies)\.json(?:\?.*)?$/,
          );
          if (!match) return next();
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(
            readFileSync(
              new URL(
                `../interview-prep/data/${match[1]}.json`,
                import.meta.url,
              ),
            ),
          );
        });
      },
    },
  ],
  base: "/interview-prep/",
  build: { outDir: "../interview-prep", emptyOutDir: false },
  server: { port: 5187 },
});
