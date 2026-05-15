/**
 * LotePanel
 * Panel lateral derecho que se desliza al seleccionar un lote.
 * El canvas se comprime para mantener el lote visible.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2, ChevronLeft, ChevronRight, ImageOff, Expand } from 'lucide-react'

// Carga todas las imágenes de implantación agrupadas por topografía
const allImplantaciones = import.meta.glob(
  '../assets/implantaciones/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG}',
  { eager: true }
)

function getImplantImages(topografia) {
  const key = topografia ?? 'Standard'
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

const TOPO_CFG = {
  Premium:   { nombre: 'Legado',      tipo: 'Lotes Premium',   color: '#C4B49A', bg: 'rgba(154,125,74,0.08)',   desc: '7.8% – 30% de pendiente'  },
  Standard:  { nombre: 'Pertenencia', tipo: 'Lotes Standard',  color: '#7BBFDA', bg: 'rgba(123,191,218,0.08)', desc: '30% – 60% de pendiente'   },
  Pendiente: { nombre: 'Origen',      tipo: 'Lotes Pendiente', color: '#DBA96A', bg: 'rgba(219,169,106,0.08)', desc: '60% – 80% de pendiente'   },
}

const ESTADOS = ['disponible', 'reservado', 'vendido']

const fmtCOP = n => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(n)

const F = { fontFamily: 'Inter, system-ui, sans-serif' }

export default function LotePanel({ lote, onClose, onEstadoChange, canEdit = false }) {
  const cfg      = ESTADO_CFG[lote?.estado] ?? ESTADO_CFG.disponible
  const topo     = TOPO_CFG[lote?.topografia] ?? { color: '#C4B49A', bg: 'rgba(154,125,74,0.08)', desc: '' }
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

  return (
    <AnimatePresence>
      {lote && (
        <motion.div
          id="lote-panel"
          key={lote.id}
          initial={{ x: PANEL_W }}
          animate={{ x: 0 }}
          exit={{   x: PANEL_W }}
          transition={{ type: 'spring', stiffness: 320, damping: 38 }}
          style={{
            position: 'fixed',
            top: 0, right: 0, bottom: 0,
            width: PANEL_W,
            zIndex: 9100,
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(10,22,34,0.84)',
            backdropFilter: 'blur(80px) saturate(200%)',
            WebkitBackdropFilter: 'blur(80px) saturate(200%)',
            borderLeft: '1px solid rgba(196,180,154,0.18)',
            boxShadow: '-24px 0 72px rgba(0,0,0,0.35)',
            pointerEvents: 'auto',
          }}
        >

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
                  Parcelación Native
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

            {/* ── Topografía HERO (bloque completo) ── */}
            <div style={{
              padding: '22px 24px',
              background: topo.bg,
              borderBottom: `1px solid ${topo.color}20`,
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Franja de color izquierda */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                background: topo.color,
                borderRadius: '0 2px 2px 0',
              }} />
              <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.50)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', ...F }}>
                Categoría
              </p>
              <p style={{ margin: '0 0 6px', color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, ...F }}>
                {topo.nombre ?? lote.topografia}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, ...F }}>
                  {topo.tipo}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: 10 }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, ...F }}>
                  {topo.desc}
                </span>
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
                      {topo.nombre ?? lote.topografia}
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
                        transition={{ duration: 0.28 }}
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

          {/* ── Lightbox — dentro del panel para que el listener no lo intercepte ── */}
          <AnimatePresence>
            {lightbox && images.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={e => { e.stopPropagation(); setLightbox(false) }}
                style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                  <div>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', ...F }}>Implantación sugerida</p>
                    <p style={{ margin: '2px 0 0', color: topo.color, fontSize: 14, fontWeight: 700, ...F }}>{topo.nombre}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {images.length > 1 && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 600, ...F }}>{imgIdx + 1} / {images.length}</span>}
                    <button onClick={e => { e.stopPropagation(); setLightbox(false) }}
                      style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={15} />
                    </button>
                  </div>
                </div>

                <motion.div onClick={e => e.stopPropagation()}
                  style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatePresence mode="wait">
                    <motion.img key={imgIdx} src={images[imgIdx]} alt="Implantación"
                      initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25 }}
                      style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }} />
                  </AnimatePresence>
                </motion.div>

                {images.length > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + images.length) % images.length) }}
                      style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronLeft size={22} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % images.length) }}
                      style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronRight size={22} />
                    </button>
                    <div onClick={e => e.stopPropagation()}
                      style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, padding: '8px 12px', borderRadius: 14, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
                      {images.map((src, i) => (
                        <button key={i} onClick={e => { e.stopPropagation(); setImgIdx(i) }}
                          style={{ width: i === imgIdx ? 64 : 44, height: i === imgIdx ? 44 : 32, borderRadius: 8, padding: 0, border: i === imgIdx ? `2px solid ${topo.color}` : '2px solid rgba(255,255,255,0.15)', overflow: 'hidden', cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}>
                          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  )
}
