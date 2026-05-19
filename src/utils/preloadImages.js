/**
 * preloadImages.js
 * Descarga en background todas las imágenes de la app al arrancar,
 * para que el browser las tenga en caché antes de que el usuario
 * toque un lote o abra una zona.
 */

// Vite resuelve estos globs en build time → URLs absolutas
const implantaciones = import.meta.glob(
  '../assets/implantaciones/**/*.{webp,jpg,jpeg,png}',
  { eager: true }
)
const zonaImgs = import.meta.glob(
  '../assets/zonas/**/*.{webp,jpg,jpeg,png}',
  { eager: true }
)

function extractUrls(glob) {
  return Object.values(glob).map(m => m.default).filter(Boolean)
}

const ALL_URLS = [
  ...extractUrls(implantaciones),
  ...extractUrls(zonaImgs),
]

/**
 * Llama esto una vez al montar la app.
 * Carga las imágenes en orden de prioridad:
 *   1. Implantaciones (pequeñas, usuario las ve pronto)
 *   2. Zona gallery (más pesadas, carga en background)
 */
export function preloadAllImages() {
  // Usar requestIdleCallback para no bloquear el render inicial
  const load = () => {
    ALL_URLS.forEach(url => {
      const img = new window.Image()
      img.src = url
    })
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(load, { timeout: 3000 })
  } else {
    setTimeout(load, 1000)
  }
}
