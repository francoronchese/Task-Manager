import { defineConfig } from "vitest/config";

// Vitest config for the server's integration tests (Supertest)
export default defineConfig({
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
