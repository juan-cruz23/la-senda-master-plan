/**
 * ZonaPopup
 * Tarjeta flotante que aparece al hacer click en una zona común.
 * Muestra un resumen y un botón para abrir el panel completo.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'

const F = { fontFamily: 'Inter, system-ui, sans-serif' }

const glass = {
  background: 'rgba(10,22,34,0.93)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
}

export default function ZonaPopup({ zona, offset = 80, onClose, onOpenPanel }) {
  return (
    <AnimatePresence>
      {zona && (
        <motion.div
          key={zona.id}
          initial={{ opacity: 0, y: 14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{   opacity: 0, y: 8,  scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 560, damping: 38, mass: 0.65 }}
          style={{
            position: 'fixed',
            left: '50%',
            marginLeft: -160,
            bottom: `min(calc(50% + ${offset}px), calc(100vh - 100px))`,
            zIndex: 9000,
            width: 320,
            borderRadius: 18,
            overflow: 'hidden',
            border: `1px solid ${zona.color}38`,
            pointerEvents: 'auto',
            ...glass,
          }}
        >
          {/* ── Header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '13px 14px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `${zona.color}14`,
              border: `1.5px solid ${zona.color}42`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: zona.color, fontSize: 11, fontWeight: 800, ...F }}>
                {zona.codigo}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 2px', color: 'rgba(255,255,255,0.30)', fontSize: 9, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', ...F }}>
                Zona común
              </p>
              <p style={{ margin: 0, color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, ...F }}>
                {zona.nombre}
              </p>
            </div>

            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.22)', flexShrink: 0, transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.22)'}
            >
              <X size={13} />
            </button>
          </div>

          {/* ── Descripción ── */}
          <div style={{ padding: '11px 15px 13px' }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.52)', fontSize: 12, lineHeight: 1.7, ...F }}>
              {zona.descripcion}
            </p>
          </div>

          {/* ── Características (pills) ── */}
          {zona.destacados?.length > 0 && (
            <div style={{ padding: '0 14px 11px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {zona.destacados.map(d => (
                <span key={d} style={{
                  padding: '4px 10px', borderRadius: 999,
                  background: `${zona.color}0E`,
                  border: `1px solid ${zona.color}28`,
                  color: zona.color,
                  fontSize: 10.5, fontWeight: 600, ...F,
                }}>
                  {d}
                </span>
              ))}
            </div>
          )}

          {/* ── Botón Ver amenidad ── */}
          <div style={{ padding: '0 14px 14px' }}>
            <button
              onClick={onOpenPanel}
              style={{
                width: '100%', padding: '11px 14px', borderRadius: 11,
                background: `${zona.color}18`,
                border: `1.5px solid ${zona.color}50`,
                color: zona.color,
                fontSize: 12, fontWeight: 700, letterSpacing: '0.01em', ...F,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${zona.color}28`; e.currentTarget.style.borderColor = `${zona.color}80` }}
              onMouseLeave={e => { e.currentTarget.style.background = `${zona.color}18`; e.currentTarget.style.borderColor = `${zona.color}50` }}
            >
              Ver amenidad
              <ChevronRight size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
