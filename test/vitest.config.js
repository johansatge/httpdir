import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 1000,
    coverage: {
      provider: 'v8',
      reportsDirectory: '.coverage',
      include: ['src/**'],
      exclude: ['src/cli.js', 'src/ui/**'],
    },
  },
})
