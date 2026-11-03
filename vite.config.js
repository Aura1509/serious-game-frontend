import { defineConfig } from 'vite';

// base relativa: el sitio funciona igual en GitHub Pages (/<repositorio>/) y en local.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    // three.js va en su propio archivo para que el navegador lo guarde en caché entre versiones.
    rollupOptions: { output: { manualChunks: { three: ['three'] } } },
    chunkSizeWarningLimit: 800,
  },
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'] },
});
