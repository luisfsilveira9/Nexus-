// NX-015: unitários do motor e do save (Vitest, no Node). Cobertura C7: 90% das linhas e 85% dos
// ramos em src/engine/ e src/save/; abaixo disso, `npm run test:coverage` (e `npm test`) falha.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // tests/**/*.test.ts: integração do QA (QA-28 c). Os .spec.ts são do Playwright.
    include: ['src/**/*.test.{ts,tsx}', 'tools/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts', 'src/save/**/*.ts', 'src/app/**/*.ts'],
      exclude: ['**/*.test.ts', 'src/app/navegador.ts', 'src/app/debug.ts'],
      reporter: ['text', 'text-summary', 'json-summary'],
      thresholds: {
        'src/engine/**': { lines: 90, branches: 85 },
        'src/save/**': { lines: 90, branches: 85 },
      },
    },
  },
});
