import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

const TOUR_FILE  = path.resolve('./src/data/zonesTour.json')
const LOTES_FILE = path.resolve('./src/data/lotes.json')

function handlePost(req, res, handler) {
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed') }
  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    try {
      handler(JSON.parse(body))
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ ok: true }))
    } catch (e) {
      res.statusCode = 500
      res.end(JSON.stringify({ ok: false, error: e.message }))
    }
  })
}

/** Plugin que expone endpoints para persistir datos en JSON */
function devSaverPlugin() {
  return {
    name: 'dev-saver',
    configureServer(server) {
      // POST /api/save-tour  { zoneId, links }
      server.middlewares.use('/api/save-tour', (req, res) => {
        handlePost(req, res, ({ zoneId, links }) => {
          const current = JSON.parse(fs.readFileSync(TOUR_FILE, 'utf-8'))
          current[zoneId] = links
          fs.writeFileSync(TOUR_FILE, JSON.stringify(current, null, 2), 'utf-8')
        })
      })

      // POST /api/save-lotes  { centers: { L01: {cx,cy}, ... } }
      server.middlewares.use('/api/save-lotes', (req, res) => {
        handlePost(req, res, ({ centers }) => {
          const lotes = JSON.parse(fs.readFileSync(LOTES_FILE, 'utf-8'))
          for (const lote of lotes) {
            if (centers[lote.id]) {
              lote.cx = centers[lote.id].cx
              lote.cy = centers[lote.id].cy
            }
          }
          fs.writeFileSync(LOTES_FILE, JSON.stringify(lotes, null, 2), 'utf-8')
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    devSaverPlugin(),
    VitePWA({
      registerType: 'prompt',
      selfDestroying: true,
      workbox: {
        // Cachea todo el bundle JS/CSS en la primera visita
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        // Imágenes grandes → cache-first (sirve desde caché, actualiza en background)
        runtimeCaching: [
          {
            urlPattern: /\.(?:webp|jpg|jpeg|png|svg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 días
            },
          },
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'assets-cache' },
          },
        ],
        // Aumenta límite para cachear imágenes grandes (360s son ~4MB)
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MB
      },
      manifest: {
        name: 'La Senda',
        short_name: 'La Senda',
        description: 'Masterplan interactivo — Parcelación La Senda',
        theme_color: '#1C2A17',
        background_color: '#1C2A17',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: '/favi.png', sizes: '192x192', type: 'image/png' },
          { src: '/favi.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    host: true,
  },
})
