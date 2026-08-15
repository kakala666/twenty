import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the `src/*` alias declared in tsconfig.json, the same mapping
  // esbuild uses when the SDK bundles the logic functions.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
