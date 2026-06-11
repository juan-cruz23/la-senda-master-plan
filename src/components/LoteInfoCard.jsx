/**
 * LoteInfoCard
 * Card flotante que aparece al seleccionar un lote.
 * Posicionada en la esquina superior derecha, bajo el botón Picker.
 */
import { motion, AnimatePresence } from 'framer-motion'
import { X, Maximize2 } from 'lucide-react'

const ESTADO_CFG = {
  disponible: { color: '#4ECDC4',  label: 'Disponible', bg: 'rgba(78,205,196,0.15)', border: 'rgba(78,205,196,0.45)' },
  reservado:  { color: '#f59e0b',  label: 'Reservado',  bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)' },
  vendido:    { color: '#ef4444',  label: 'Vendido',    bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.35)'  },
}

const TOPO_CFG = {
  Esencia: { icon: '◇', desc: '0% – 40% pendiente'  },
  Camino:  { icon: '◈', desc: '40% – 60% pendiente' },
  Paisaje: { icon: '◆', desc: '> 60% pendiente'      },
}

const glass = {
  background: 'rgba(28,42,23,0.90)',
  backdropFilter: 'blur(52px) saturate(160%)',
  WebkitBackdropFilter: 'blur(52px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 6px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
}

const fmtCOP = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const spring = { type: 'spring', stiffness: 420, damping: 38, mass: 0.85 }

const ESTADOS = ['disponible', 'reservado', 'vendido']

export default function LoteInfoCard({ lote, onClose, onEstadoChange }) {
  return (
    <AnimatePresence>
      {lote && (
        <motion.div
          key={lote.id}
          initial={{ opacity: 0, x: -16, scale: 0.96 }}
          animate={{ opacity: 1, x: 0,   scale: 1    }}
          exit={{   opacity: 0, x: -16, scale: 0.96 }}
          transition={spring}
          style={{ position: 'relative', zIndex: 30, width: 272, pointerEvents: 'auto', borderRadius: 18, overflow: 'hidden', ...glass }}
        >
          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {/* Badge lote */}
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: ESTADO_CFG[lote.estado]?.bg,
              border: `1px solid ${ESTADO_CFG[lote.estado]?.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: ESTADO_CFG[lote.estado]?.color, fontSize: 11, fontWeight: 800 }}>
                {lote.id}
              </span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                {lote.nombre}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: ESTADO_CFG[lote.estado]?.color, flexShrink: 0 }} />
                <span style={{ color: ESTADO_CFG[lote.estado]?.color, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {ESTADO_CFG[lote.estado]?.label}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'rgba(255,255,255,0.22)', flexShrink: 0, transition: 'color .15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.22)'}
            >
              <X size={13} />
            </button>
          </div>

          {/* ── Stats grid ── */}
          {/* ── Selector de estado ── */}
          <div style={{ display: 'flex', gap: 6, padding: '12px 14px 4px' }}>
            {ESTADOS.map(e => {
              const cfg    = ESTADO_CFG[e]
              const active = lote.estado === e
              return (
                <button
                  key={e}
                  onClick={() => onEstadoChange?.(lote.id, e)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 9, cursor: 'pointer',
                    transition: 'all 0.18s',
                    background: active ? `${cfg.color}20` : 'rgba(255,255,255,0.04)',
                    border: active ? `1px solid ${cfg.color}50` : '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: active ? cfg.color : 'rgba(255,255,255,0.18)',
                    boxShadow: active ? `0 0 8px ${cfg.color}80` : 'none',
                    transition: 'all 0.18s',
                  }} />
                  <span style={{
                    fontSize: 9, fontWeight: 700, textTransform: 'capitalize',
                    color: active ? cfg.color : 'rgba(255,255,255,0.28)',
                    letterSpacing: '0.04em',
                    transition: 'color 0.18s',
                  }}>
                    {cfg.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: '12px 14px 8px' }}>
            <StatBox label="Área" value={`${lote.area} m²`} icon={<Maximize2 size={10} />} />
            <StatBox
              label="Topografía"
              value={`${TOPO_CFG[lote.topografia]?.icon ?? '—'} ${lote.topografia}`}
              desc={TOPO_CFG[lote.topografia]?.desc}
            />
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatBox({ label, value, accent, color, icon, desc }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '9px 11px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        {icon && <span style={{ color: 'rgba(255,255,255,0.25)' }}>{icon}</span>}
        <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</span>
      </div>
      <span style={{ color: accent ? (color ?? '#B8C89A') : 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>{value}</span>
      {desc && (
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.28)', fontSize: 9, lineHeight: 1.5, letterSpacing: '0.01em' }}>
          {desc}
        </p>
      )}
    </div>
  )
}
