import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React & Router
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Heavy Live Streaming Engine
          livekit: ['@livekit/components-react', 'livekit-client'],
          // Sockets, Charts, and Icons
          ui: ['recharts', 'lucide-react', 'socket.io-client']
        }
      }
    }
  }
})