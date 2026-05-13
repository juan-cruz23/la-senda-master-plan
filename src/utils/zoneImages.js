/**
 * zoneImages.js
 * Auto-detecta TODAS las imágenes dentro de src/assets/zonas/[ID]/
 * usando import.meta.glob de Vite — sin límite de archivos.
 *
 * Convención de nombres:
 *   360_*.jpg / pano_*.jpg  → visor 360°  (images360)
 *   cualquier otro nombre   → galería JPG (images)
 *
 * Cómo agregar imágenes:
 *   1. Copia el archivo en  src/assets/zonas/[ID]/
 *   2. Reinicia el servidor dev (vite detecta los nuevos archivos)
 *   3. Listo — aparece automáticamente en la galería.
 */

// Vite analiza este glob en tiempo de compilación
const raw = import.meta.glob(
  '../assets/zonas/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true }
)

function buildMap() {
  const map = {}

  for (const [path, mod] of Object.entries(raw)) {
    // path ej: "../assets/zonas/CD/foto1.jpg"
    const parts    = path.split('/')
    const zoneId   = parts[parts.length - 2]   // "CD"
    const filename = parts[parts.length - 1]   // "foto1.jpg"
    const url      = mod.default               // URL procesada por Vite

    if (!map[zoneId]) map[zoneId] = { images360: [], images: [] }

    const name = filename.toLowerCase()
    if (name.startsWith('360_') || name.startsWith('pano_')) {
      map[zoneId].images360.push(url)
    } else {
      map[zoneId].images.push(url)
    }
  }

  // Ordenar alfabéticamente dentro de cada array
  for (const z of Object.values(map)) {
    z.images360.sort()
    z.images.sort()
  }

  return map
}

export const zoneImagesMap = buildMap()

/** Devuelve { images360, images } para un ID de zona dado */
export function getZoneImages(zoneId) {
  return zoneImagesMap[zoneId] ?? { images360: [], images: [] }
}
