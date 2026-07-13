import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Mirrors the path aliases from tsconfig.json. Vitest doesn't read tsconfig paths on its own
const alias = {
  "@app": resolve(__dirname, "src/app.ts"),
  "@controllers": resolve(__dirname, "src/controllers"),
  "@routes": resolve(__dirname, "src/routes"),
  "@db": resolve(__dirname, "src/db"),
  "@middlewares": resolve(__dirname, "src/middlewares"),
  "@utils": resolve(__dirname, "src/utils"),
  "@validators": resolve(__dirname, "src/validators"),
  "@apptypes": resolve(__dirname, "src/types"),
  "@config": resolve(__dirname, "src/config.ts"),
};

// Vitest config for the server's integration tests (Supertest)
export default defineConfig({
  resolve: { alias },
  test: {
    // Pure backend, no DOM needed
    environment: "node",
    // Default 5s can be too short: real DB calls + argon2 hashing
    testTimeout: 10000,
    // Test files share one DB, so run them one at a time to avoid clashes
    fileParallelism: false,
    // Globals (describe/it/expect/vi) available in every test file without importing them
    globals: true,
    // Applies pending migrations to the test DB before the suite runs
    globalSetup: "./vitest.global-setup.ts",
  },
});
