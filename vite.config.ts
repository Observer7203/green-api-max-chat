/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // Relative paths: the build works both at the root of a domain and in a subfolder,
  // which is where GitHub Pages puts it.
  base: './',
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    unstubGlobals: true,
  },
});
