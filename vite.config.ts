/// <reference types="vitest" />
import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Module Federation: este remoto expone './remote' (mount y unmount, src/remote.tsx) con su propio React: cada remoto monta su raíz aislada (sin estado compartido con el shell).
// Contrato con el shell: ver frontends/shell/src/remotes/contrato.ts.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'residente',
      filename: 'remoteEntry.js',
      exposes: { './remote': './src/remote.tsx' },
    }),
  ],
  // Solo al compilar el remoto: en los tests React debe quedar en modo desarrollo para que act() funcione.
  define: process.env.VITEST ? {} : { 'process.env.NODE_ENV': '"production"' },
  // Sin index.html: el contenedor federado es la única salida; la entrada es el propio remoto.
  build: { target: 'esnext', minify: false, cssCodeSplit: false, rollupOptions: { input: 'src/remote.tsx' } },
  preview: { port: 5174, strictPort: true, cors: true },
  test: { environment: 'jsdom', include: ['tests/**/*.test.{ts,tsx}'] },
});
