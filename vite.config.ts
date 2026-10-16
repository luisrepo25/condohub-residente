/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// El shell carga este remoto con import(url): el build es un mÃ³dulo ES que exporta mount y unmount (src/remote.tsx).
// Contrato con el shell: ver frontends/shell/src/remotes/contrato.ts.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    target: 'esnext',
    lib: { entry: 'src/remote.tsx', formats: ['es'], fileName: () => 'assets/remoteEntry.js' },
  },
  preview: { port: 5174, strictPort: true, cors: true },
  test: { environment: 'jsdom', include: ['tests/**/*.test.{ts,tsx}'] },
});