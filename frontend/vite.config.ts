import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
    headers: {
      // Cross-Origin headers for enhanced security
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      // Note: COEP is commented out as it may break Phaser/TensorFlow functionality
      // Uncomment and test thoroughly before enabling in production
      // 'Cross-Origin-Embedder-Policy': 'require-corp'
    }
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
