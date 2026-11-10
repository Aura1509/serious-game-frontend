import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativa: el sitio funciona igual en GitHub Pages (/<repositorio>/) y en local.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    // three.js va en su propio archivo para que el navegador lo guarde en caché entre versiones.
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom'],
          r3f: ['@react-three/fiber', '@react-three/drei', 'three-mesh-bvh'],
          efectos: ['postprocessing', '@react-three/postprocessing', 'n8ao'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  test: { environment: 'jsdom', include: ['tests/**/*.test.js'] },
});
