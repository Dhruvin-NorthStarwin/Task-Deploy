import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Force HTTPS for Railway backend URLs in production
  if (mode === 'production' && env.VITE_API_BASE_URL) {
    if (env.VITE_API_BASE_URL.includes('radiant-amazement-production-d68f.up.railway.app') && 
        env.VITE_API_BASE_URL.startsWith('http://')) {
      env.VITE_API_BASE_URL = env.VITE_API_BASE_URL.replace('http://', 'https://');
      if (env.VITE_DEBUG === 'true') {
        console.log('🔒 Fixed API URL to use HTTPS:', env.VITE_API_BASE_URL);
      }
    }
  }
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': 'http://localhost:8000'
      }
    },
    // PWA Configuration
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          sw: 'public/sw.js'
        },
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'sw.js') {
              return 'sw.js'
            }
            return 'assets/[name]-[hash][extname]'
          }
        }
      }
    },
    // Make sure env vars are available to the app
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || 'https://radiant-amazement-production-d68f.up.railway.app/api'),
      'import.meta.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG),
      'import.meta.env.VITE_UPLOAD_MAX_SIZE': JSON.stringify(env.VITE_UPLOAD_MAX_SIZE),
      'import.meta.env.VITE_REQUEST_TIMEOUT': JSON.stringify(env.VITE_REQUEST_TIMEOUT),
    }
  }
})
