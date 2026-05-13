/**
 * ZonaPanel
 * Panel lateral derecho que se desliza al hacer click en una zona común.
 * Contiene galería de imágenes (o placeholder) + texto y destacados.
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

export default function ZonaPanel({ zona, onClose }) {
  const [imgIndex, setImgIndex] = useState(0)
  const [imgError, setImgError] = useState({})

  // Reset al cambiar zona
  useEffect(() => {
    setImgIndex(0)
    setImgError({})
  }, [zona?.id])

  // Esc para cerrar
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const prev = useCallback(() =>
    setImgIndex(i => (i - 1 + (zona?.images?.length || 1)) % (zona?.images?.length || 1)), [zona])
  const next = useCallback(() =>
    setImgIndex(i => (i + 1) % (zona?.images?.length || 1)), [zona])

  if (!zona) return null

  const images = zona.images ?? []
  const hasImages = images.length > 0
  const currentImg = images[imgIndex]
  const currentImgFailed = imgError[imgIndex]

  return (
    <AnimatePresence>
      {zona && (
        <>
          {/* Backdrop semitransparente */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 9050,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          />

          {/* Panel */}
          <motion.div
            key={zona.id}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0,      opacity: 1 }}
            exit={{   x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 38 }}
            style={{
              position: 'fixed',
              top: 0, right: 0, bottom: 0,
              width: 420,
              zIndex: 9100,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(10,22,34,0.97)',
              backdropFilter: 'blur(52px) saturate(180%)',
              WebkitBackdropFilter: 'blur(52px) saturate(180%)',
              borderLeft: `1px solid rgba(196,180,154,0.14)`,
              boxShadow: `-32px 0 80px rgba(0,0,0,0.55)`,
              pointerEvents: 'auto',
            }}
          >

            {/* ── Galería ── */}
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', flexShrink: 0, background: '#0a170b', overflow: 'hidden' }}>

              {/* Imagen actual o placeholder */}
              {hasImages && !currentImgFailed ? (
                <img
                  key={currentImg}
                  src={currentImg}
                  alt={`${zona.nombre} ${imgIndex + 1}`}
                  onError={() => setImgError(e => ({ ...e, [imgIndex]: true }))}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                /* Placeholder elegante */
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                  background: `linear-gradient(135deg, #0a170b 0%, ${zona.color}12 100%)`,
                }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 16,
                    background: `${zona.color}18`,
                    border: `1px solid ${zona.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ImageOff size={22} color={zona.color} opacity={0.5} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    Imágenes próximamente
                  </span>
                </div>
              )}

              {/* Gradiente inferior sobre imagen */}
              {hasImages && !currentImgFailed && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                  background: 'linear-gradient(to top, rgba(10,22,34,0.8), transparent)',
                  pointerEvents: 'none',
                }} />
              )}

              {/* Controles de navegación */}
              {hasImages && images.length > 1 && (
                <>
                  <button onClick={prev} style={navBtnStyle('left')}>
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={next} style={navBtnStyle('right')}>
                    <ChevronRight size={18} />
                  </button>

                  {/* Dots */}
                  <div style={{
                    position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', gap: 5,
                  }}>
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        style={{
                          width: i === imgIndex ? 18 : 6, height: 6,
                          borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0,
                          background: i === imgIndex ? zona.color : 'rgba(255,255,255,0.3)',
                          transition: 'all 0.25s',
                        }}
                      />
                    ))}
                  </div>

                  {/* Contador */}
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(0,0,0,0.55)', borderRadius: 8,
                    padding: '3px 8px',
                    color: 'rgba(255,255,255,0.7)', fontSize: 11,
                    fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 600,
                  }}>
                    {imgIndex + 1} / {images.length}
                  </div>
                </>
              )}

              {/* Botón cerrar sobre la imagen */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 32, height: 32, borderRadius: '50%', border: 'none',
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* ── Contenido ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Encabezado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: `${zona.color}15`,
                  border: `1.5px solid ${zona.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: zona.color, fontSize: 12, fontWeight: 800, fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {zona.codigo}
                  </span>
                </div>
                <div>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    Zona común
                  </p>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.2 }}>
                    {zona.nombre}
                  </h2>
                </div>
              </div>

              {/* Separador */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              {/* Descripción */}
              <p style={{
                margin: 0,
                color: 'rgba(255,255,255,0.55)',
                fontSize: 13.5,
                lineHeight: 1.75,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                {zona.descripcion}
              </p>

              {/* Destacados */}
              {zona.destacados?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    Características
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {zona.destacados.map(d => (
                      <span key={d} style={{
                        padding: '5px 12px',
                        borderRadius: 999,
                        background: `${zona.color}10`,
                        border: `1px solid ${zona.color}30`,
                        color: zona.color,
                        fontSize: 11.5,
                        fontWeight: 600,
                        fontFamily: 'Inter, system-ui, sans-serif',
                        letterSpacing: '0.01em',
                      }}>
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function navBtnStyle(side) {
  return {
    position: 'absolute',
    top: '50%', transform: 'translateY(-50%)',
    [side]: 12,
    width: 34, height: 34, borderRadius: '50%', border: 'none',
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'rgba(255,255,255,0.75)',
    transition: 'all 0.15s',
  }
}
