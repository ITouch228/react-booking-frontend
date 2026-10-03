import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Pages и layout-компоненты — презентационные, покрываются e2e,
      // а не unit-тестами. Считаем покрытие по ядру: api, hooks, context,
      // утилиты, типы и интерактивный TimeSlotSlider.
      include: [
        'src/api/**',
        'src/hooks/**',
        'src/context/**',
        'src/utils/**',
        'src/types/**',
        'src/components/TimeSlotSlider.tsx',
      ],
      exclude: ['src/**/*.test.*', 'src/test/**'],
    },
    // Add explicit test match pattern
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
});
