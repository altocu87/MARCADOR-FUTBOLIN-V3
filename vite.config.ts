import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { pwaPlugin } from './tooling/pwa.ts'

export default defineConfig(({ mode }) => ({
  plugins: [react(), pwaPlugin()],
  build: mode === 'offline-test' ? { outDir: 'tmp/pwa-test', rollupOptions: { input: ['index.html', 'tests/ui-fixture.html'] } } : {},
}))
