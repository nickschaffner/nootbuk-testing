import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function dexieCloudServiceWorker(): Plugin {
  const source = path.resolve(
    __dirname,
    'node_modules/dexie-cloud-addon/dist/umd/service-worker.min.js',
  )
  const urlPath = '/dexie-cloud-sw.js'

  return {
    name: 'dexie-cloud-service-worker',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== urlPath) {
          next()
          return
        }
        res.setHeader('Content-Type', 'application/javascript')
        fs.createReadStream(source).pipe(res)
      })
    },
    closeBundle() {
      fs.copyFileSync(source, path.resolve(__dirname, 'dist/dexie-cloud-sw.js'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), dexieCloudServiceWorker()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
