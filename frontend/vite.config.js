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
        // Changed from an Object to a Function 
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React & Router
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-core';
            }
            // Heavy Live Streaming Engine
            if (id.includes('@livekit') || id.includes('livekit-client')) {
              return 'livekit';
            }
            // Charts
            if (id.includes('recharts')) {
              return 'recharts';
            }
            // Animations
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            // Other utilities and libraries
            return 'vendor-utils';
          }
        }
      }
    }
  }
})