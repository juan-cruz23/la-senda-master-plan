/**
 * LotePanel
 * Panel lateral derecho que se desliza al seleccionar un lote.
 * El canvas se comprime para mantener el lote visible.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, ChevronLeft, ChevronRight, ImageOff, Expand } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

// Carga todas las imágenes de implantación agrupadas por topografía
const allImplantaciones = import.meta.glob(
  '../assets/implantaciones/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}',
  { eager: true }
)

function getImplantImages(topografia) {
  const key = topografia ?? 'Esencia'
  return Object.entries(allImplantaciones)
    .filter(([path]) => path.includes(`/implantaciones/${key}/`))
    .map(([, mod]) => mod.default)
}

export const PANEL_W = 400

const ESTADO_CFG = {
  disponible: { color: '#4ECDC4',  label: 'Disponible', bg: 'rgba(78,205,196,0.15)', border: 'rgba(78,205,196,0.45)'  },
  reservado:  { color: '#f59e0b',  label: 'Reservado',  bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)'   },
  vendido:    { color: '#ef4444',  label: 'Vendido',    bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)'    },
}

const ETAPA_CFG = {
  'Etapa 1': { color: '#B8C89A', bg: 'rgba(184,200,154,0.08)' },
  'Etapa 2': { color: '#7BBFDA', bg: 'rgba(123,191,218,0.08)' },
  'Etapa 3': { color: '#DBA96A', bg: 'rgba(219,169,106,0.08)' },
}

const TOPO_CFG = {
  Esencia: { color: '#8B9E6E', bg: 'rgba(139,158,110,0.08)', desc: '0% – 40% pendiente'  },
  Camino:  { color: '#9A7D45', bg: 'rgba(154,125,69,0.08)',  desc: '40% – 60% pendiente' },
  Paisaje: { color: '#DBA96A', bg: 'rgba(219,169,106,0.08)', desc: '> 60% pendiente'      },
}

const ESTADOS = ['disponible', 'reservado', 'vendido']

const fmtCOP = n => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(n)

const F = { fontFamily: 'Inter, system-ui, sans-serif' }

export default function LotePanel({ lote, onClose, onEstadoChange, canEdit = false }) {
  const isMobile = useIsMobile()
  const cfg      = ESTADO_CFG[lote?.estado] ?? ESTADO_CFG.disponible
  const topo     = TOPO_CFG[lote?.topografia] ?? { color: '#8B9E6E', bg: 'rgba(139,158,110,0.08)', desc: '' }
  const etapaCfg = ETAPA_CFG[lote?.etapa]    ?? { color: '#B8C89A', bg: 'rgba(184,200,154,0.08)' }
  const images   = lote ? getImplantImages(lote.topografia) : []
  const [imgIdx,    setImgIdx]    = useState(0)
  const [lightbox,  setLightbox]  = useState(false)

  // Reset al cambiar de lote
  useEffect(() => {
    setLightbox(false)
    setImgIdx(0)
  }, [lote?.id])

  useEffect(() => {
    if (!lightbox) return
    const fn = e => { if (e.key === 'Escape') setLightbox(false) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [lightbox])

  // Preload siguiente imagen del carrusel
  useEffect(() => {
    if (images.length < 2) return
    const next = images[(imgIdx + 1) % images.length]
    const img = new Image()
    img.src = next
  }, [imgIdx, images])

  return (
    <>
    <AnimatePresence>
      {lote && (
        <motion.div
          id="lote-panel"
          key={lote.id}
          initial={isMobile ? { y: '100%' } : { x: PANEL_W }}
          animate={isMobile ? { y: 0 }      : { x: 0 }}
          exit={isMobile   ? { y: '100%' }  : { x: PANEL_W }}
          transition={isMobile
            ? { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.26 }
            : { type: 'spring', stiffness: 320, damping: 38 }
          }
          style={isMobile ? {
            // ── Mobile: bottom sheet ──
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            maxHeight: '85vh',
            zIndex: 9100,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(28,42,23,0.98)',
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            borderTop: '1px solid rgba(184,200,154,0.18)',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -24px 72px rgba(0,0,0,0.5)',
            pointerEvents: 'auto',
            willChange: 'transform',
          } : {
            // ── Desktop: side panel ──
            position: 'fixed',
            top: 0, right: 0, bottom: 0,
            width: PANEL_W,
            zIndex: 9100,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(28,42,23,0.84)',
            backdropFilter: 'blur(32px) saturate(200%)',
            WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            borderLeft: '1px solid rgba(184,200,154,0.18)',
            boxShadow: '-24px 0 72px rgba(0,0,0,0.35)',
            pointerEvents: 'auto',
            willChange: 'transform',
          }}
        >
          {/* Drag handle — solo móvil */}
          {isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
            </div>
          )}

          {/* ── Header ── */}
          <div style={{
            padding: '24px 24px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

              {/* Badge número — siempre legible */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: `${topo.color}18`,
                border: `1.5px solid ${topo.color}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 900, ...F }}>
                  {lote.id}
                </span>
              </div>

              {/* Título */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.32)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', ...F }}>
                  Parcelación La Senda
                </p>
                <h2 style={{ margin: 0, color: '#fff', fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, ...F }}>
                  {lote.nombre}
                </h2>
              </div>

              {/* Cerrar */}
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: 'none', flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)', cursor: 'pointer', marginTop: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255,255,255,0.35)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* ── Cuerpo scrollable ── */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* ── Etapa + Pendiente HERO ── */}
            <div style={{
              padding: '22px 24px',
              background: topo.bg,
              borderBottom: `1px solid ${topo.color}20`,
              position: 'relative', overflow: 'hidden',
              display: 'flex', gap: 16,
            }}>
              {/* Franja de color izquierda */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                background: topo.color, borderRadius: '0 2px 2px 0',
              }} />

              {/* Etapa */}
              {lote.etapa && (
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.40)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', ...F }}>Etapa</p>
                  <p style={{ margin: 0, color: etapaCfg.color, fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.1, ...F }}>
                    {lote.etapa}
                  </p>
                </div>
              )}

              {/* Pendiente */}
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.40)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', ...F }}>Pendiente</p>
                <p style={{ margin: '0 0 2px', color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.1, ...F }}>
                  {lote.topografia ?? '—'}
                </p>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, ...F }}>{topo.desc}</span>
              </div>
            </div>

            <div style={{ padding: '20px 24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ── Selector de estado ── */}
              <div>
                <p style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.40)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', ...F }}>
                  Estado del lote
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {ESTADOS.map(e => {
                    const c = ESTADO_CFG[e]
                    const active = lote.estado === e
                    return (
                      <button
                        key={e}
                        disabled={!canEdit}
                        onClick={() => canEdit && onEstadoChange?.(lote.id, e)}
                        style={{
                          flex: 1, padding: '18px 8px', borderRadius: 14, cursor: canEdit ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                          background: active ? c.bg : 'rgba(255,255,255,0.04)',
                          border: active ? `2px solid ${c.border}` : '2px solid rgba(255,255,255,0.07)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                          boxShadow: active ? `0 4px 20px ${c.color}25` : 'none',
                        }}
                      >
                        <span style={{
                          width: 12, height: 12, borderRadius: '50%',
                          background: active ? c.color : 'rgba(255,255,255,0.15)',
                          boxShadow: active ? `0 0 14px ${c.color}` : 'none',
                          transition: 'all 0.2s',
                        }} />
                        <span style={{
                          fontSize: 12, fontWeight: 800, textTransform: 'capitalize',
                          color: active ? c.color : 'rgba(255,255,255,0.28)',
                          letterSpacing: '0.02em', ...F, transition: 'color 0.2s',
                        }}>
                          {c.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Separador ── */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              {/* ── Área ── */}
              <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                  <Maximize2 size={11} color="rgba(255,255,255,0.28)" />
                  <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', ...F }}>Área total</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <p style={{ margin: 0, color: '#fff', fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', ...F }}>
                    {lote.area.toLocaleString('es-CO')}
                  </p>
                  <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, fontWeight: 600, ...F }}>m²</span>
                </div>
              </div>

              {/* ── Separador ── */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              {/* ── Implantación sugerida ── */}
              <div>
                {/* Header de sección */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <p style={{ margin: '0 0 3px', color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', ...F }}>
                      Implantación sugerida
                    </p>
                    <p style={{ margin: 0, color: topo.color, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', ...F }}>
                      {lote.topografia ?? '—'}
                    </p>
                  </div>
                  {images.length > 1 && (
                    <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11, fontWeight: 600, ...F, paddingBottom: 1 }}>
                      {imgIdx + 1} / {images.length}
                    </span>
                  )}
                </div>

                {/* Área de imagen */}
                {images.length === 0 ? (
                  <div style={{
                    height: 200, borderRadius: 16,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.08)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}>
                    <ImageOff size={22} color="rgba(255,255,255,0.10)" />
                    <span style={{ color: 'rgba(255,255,255,0.16)', fontSize: 11, fontWeight: 500, ...F }}>Próximamente</span>
                  </div>
                ) : (
                  <div
                    onClick={e => { e.stopPropagation(); setLightbox(true) }}
                    style={{
                      position: 'relative', borderRadius: 16, overflow: 'hidden',
                      height: 220, cursor: 'zoom-in',
                      boxShadow: `0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px ${topo.color}22`,
                    }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={imgIdx}
                        src={images[imgIdx]}
                        alt="Implantación"
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </AnimatePresence>

                    {/* Gradiente */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)', pointerEvents: 'none' }} />

                    {/* Ampliar hint */}
                    <div style={{ position: 'absolute', bottom: 11, left: 14, display: 'flex', alignItems: 'center', gap: 5, pointerEvents: 'none' }}>
                      <Expand size={11} color="rgba(255,255,255,0.55)" />
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 600, ...F }}>Toca para ampliar</span>
                    </div>

                    {/* Dots + flechas */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length) }}
                          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(10px)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ChevronLeft size={17} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length) }}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(10px)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ChevronRight size={17} />
                        </button>
                        <div style={{ position: 'absolute', bottom: 12, right: 14, display: 'flex', gap: 5 }}>
                          {images.map((_, i) => (
                            <button
                              key={i}
                              onClick={e => { e.stopPropagation(); setImgIdx(i) }}
                              style={{ width: i === imgIdx ? 22 : 6, height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer', background: i === imgIdx ? topo.color : 'rgba(255,255,255,0.35)', transition: 'all .2s' }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>

    {/* ── Lightbox — fuera del panel para evitar el transform del slide ── */}
    <AnimatePresence>
      {lightbox && lote && images.length > 0 && (
        <motion.div
          id="lote-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={e => { e.stopPropagation(); setLightbox(false); onClose() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9500,
            background: 'rgba(0,0,0,0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Barra superior */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px',
          }}>
            <div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.30)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', ...F }}>
                Implantación sugerida
              </p>
              <p style={{ margin: '3px 0 0', color: topo.color, fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', ...F }}>
                {lote?.topografia ?? '—'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {images.length > 1 && (
                <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 12, fontWeight: 600, ...F }}>
                  {imgIdx + 1} / {images.length}
                </span>
              )}
              <button
                onClick={e => { e.stopPropagation(); setLightbox(false) }}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Imagen central */}
          <motion.div
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '88vw', maxHeight: '78vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={imgIdx}
                src={images[imgIdx]}
                alt="Implantación"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22 }}
                style={{
                  maxWidth: '88vw', maxHeight: '78vh',
                  objectFit: 'contain', borderRadius: 14,
                  boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                }}
              />
            </AnimatePresence>
          </motion.div>

          {/* Flechas + thumbnails */}
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length) }}
                style={{
                  position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                  width: 50, height: 50, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.07)',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length) }}
                style={{
                  position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                  width: 50, height: 50, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.07)',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >
                <ChevronRight size={24} />
              </button>
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', gap: 8, padding: '8px 12px',
                  borderRadius: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)',
                }}
              >
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setImgIdx(i) }}
                    style={{
                      width: i === imgIdx ? 68 : 46,
                      height: i === imgIdx ? 46 : 32,
                      borderRadius: 9, padding: 0, flexShrink: 0,
                      border: i === imgIdx ? `2px solid ${topo.color}` : '2px solid rgba(255,255,255,0.14)',
                      overflow: 'hidden', cursor: 'pointer', transition: 'all .2s',
                      opacity: i === imgIdx ? 1 : 0.55,
                    }}
                  >
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </button>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
