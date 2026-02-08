import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': new URL('./', import.meta.url).pathname,
    },
  },
})
