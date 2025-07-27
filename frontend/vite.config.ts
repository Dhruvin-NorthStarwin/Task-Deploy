import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': 'http://localhost:8000'
      }
    },
    // Make sure env vars are available to the app
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.VITE_DEBUG': JSON.stringify(env.VITE_DEBUG),
      'import.meta.env.VITE_UPLOAD_MAX_SIZE': JSON.stringify(env.VITE_UPLOAD_MAX_SIZE),
      'import.meta.env.VITE_REQUEST_TIMEOUT': JSON.stringify(env.VITE_REQUEST_TIMEOUT),
    }
  }
})
