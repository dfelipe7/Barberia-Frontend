import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    isolate: false,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/vite-env.d.ts',
        'src/**/*.types.ts',
        'src/**/*.d.ts',
        'src/**/*.dto.ts',
        'src/**/*.keys.ts',
        'src/**/*.schema.ts',
        'src/**/*.facade.ts',
        'src/**/index.ts',
        'src/test/**',
        'src/**/pages/**',
        'src/**/components/**',
        'src/shared/ui/**',
        'src/shared/layout/**',
        'src/shared/routes/**',
        'src/shared/context/**',
        'src/shared/contexts/**',
        'src/shared/lib/use*.ts',
        'src/shared/lib/setBodyScrollLock.ts',
        'src/shared/lib/queryClient.ts',
        'src/shared/lib/autorizacion/roles.ts',
        'src/auth/**',
      ],
    },
  },
})
