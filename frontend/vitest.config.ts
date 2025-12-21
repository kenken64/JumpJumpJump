/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Check if running in CI environment
const isCI = process.env.CI === 'true'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
    // Prevent worker crashes during coverage runs
    pool: 'forks',
    poolOptions: {
      forks: {
        // Use less memory in CI, more locally
        execArgv: isCI 
          ? ['--max-old-space-size=4096']
          : ['--max-old-space-size=8192'],
        // Limit concurrent workers in CI to reduce memory pressure
        maxForks: isCI ? 2 : undefined,
        minForks: isCI ? 1 : undefined,
      }
    },
    // Longer timeouts for CI where resources are constrained
    testTimeout: isCI ? 60000 : 30000,
    hookTimeout: isCI ? 60000 : 30000,
    // Retry failed tests in CI (may fail due to resource constraints)
    retry: isCI ? 1 : 0,
    // Reduce memory by running tests sequentially in large files
    sequence: {
      shuffle: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/__tests__/**', 'src/vite-env.d.ts'],
      // Reduce memory usage by not processing all files at once
      all: false,
    }
  }
})
