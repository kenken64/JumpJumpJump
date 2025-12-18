import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1600, // Phaser and TensorFlow are large but unavoidable
    rollupOptions: {
      output: {
        manualChunks: {
          // Phaser is the largest dependency - split it out
          phaser: ['phaser'],
          // React ecosystem
          react: ['react', 'react-dom'],
          // TensorFlow for ML/AI features
          tensorflow: ['@tensorflow/tfjs']
        }
      }
    }
  }
})
