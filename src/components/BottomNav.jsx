import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid, SlidersHorizontal, Landmark,
  Phone, CalendarDays, CheckCircle2,
  Clock, ChevronRight, X, MapPin,
} from 'lucide-react'

import lotesInit from '../data/lotes.json'
import zonas     from '../data/zonas.json'

const fmtM = n => `$${Math.round(n / 1_000_000)}M`

const TABS = [
  { id: 'proyecto', Icon: LayoutGrid,        label: 'Proyecto' },
  { id: 'filtrar',  Icon: SlidersHorizontal, label: 'Filtrar'  },
  { id: 'zonas',    Icon: Landmark,          label: 'Zonas'    },
]

const ESTADOS = ['disponible', 'reservado', 'vendido']
const TOPOS   = ['Premium', 'Standard', 'Pendiente']

const ESTADO_CFG = {
  disponible: { color: '#4ECDC4', label: 'Disponible' },
  reservado:  { color: '#f59e0b', label: 'Reservado'  },
  vendido:    { color: '#ef4444', label: 'Vendido'    },
}

// ── Glass tokens ─────────────────────────────────────────────────────────────
const glass = {
  panel: {
    background: 'rgba(10,22,34,0.88)',
    backdropFilter: 'blur(52px) saturate(160%)',
    WebkitBackdropFilter: 'blur(52px) saturate(160%)',
    border: '1px solid rgba(196,180,154,0.12)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(196,180,154,0.05)',
  },
  dock: {
    background: 'rgba(11,30,45,0.90)',
    backdropFilter: 'blur(40px) saturate(160%)',
    WebkitBackdropFilter: 'blur(40px) saturate(160%)',
    border: '1px solid rgba(196,180,154,0.12)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.3)',
  },
  card: {
    background: 'rgba(196,180,154,0.05)',
    border: '1px solid rgba(196,180,154,0.1)',
    borderRadius: 14,
  },
}

// ── Animation ─────────────────────────────────────────────────────────────────
const spring  = { type: 'spring', stiffness: 400, damping: 36, mass: 0.85 }
const fadeUp  = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 8 }, transition: { duration: 0.2 } }

// ─────────────────────────────────────────────────────────────────────────────
export default function BottomNav({ lotes: lotesProp, onFiltersChange, onResetEstados, onSelectZona }) {
  const lotes = lotesProp ?? lotesInit

  // Stats reactivos — se recalculan cuando cambia el estado de algún lote
  const stats  = useMemo(() => lotes.reduce(
    (acc, l) => { acc[l.estado] = (acc[l.estado] || 0) + 1; return acc },
    { disponible: 0, reservado: 0, vendido: 0 }
  ), [lotes])
  const precios = useMemo(() => lotes.map(l => l.precio), [lotes])
  const areas   = useMemo(() => lotes.map(l => l.area),   [lotes])

  const [activeTab, setActiveTab] = useState(null)
  const [fEstado, setFEstado]     = useState([])
  const [fTopo,   setFTopo]       = useState([])

  const toggleTab = id => setActiveTab(prev => prev === id ? null : id)

  const toggleEstado = e => {
    const next = fEstado.includes(e) ? fEstado.filter(x => x !== e) : [...fEstado, e]
    setFEstado(next); onFiltersChange?.({ estado: next, topo: fTopo })
  }
  const toggleTopo = t => {
    const next = fTopo.includes(t) ? fTopo.filter(x => x !== t) : [...fTopo, t]
    setFTopo(next); onFiltersChange?.({ estado: fEstado, topo: next })
  }
  const resetFilters = () => { setFEstado([]); setFTopo([]); onFiltersChange?.({ estado: [], topo: [] }) }

  const hasFilters  = fEstado.length > 0 || fTopo.length > 0
  const lotesMatch  = lotes.filter(l =>
    (fEstado.length === 0 || fEstado.includes(l.estado)) &&
    (fTopo.length   === 0 || fTopo.includes(l.topografia))
  ).length

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3"
      style={{ pointerEvents: 'none' }}
    >
      {/* ── Panel ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 20, scale: 0.97 }}
            transition={spring}
            style={{ ...glass.panel, width: 460, maxHeight: '64vh', pointerEvents: 'auto', borderRadius: 20, overflow: 'hidden' }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                {TABS.find(t => t.id === activeTab)?.label}
              </span>
              <button onClick={() => setActiveTab(null)}
                style={{ color: 'rgba(255,255,255,0.22)', transition: 'color .15s' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.22)'}
              >
                <X size={13} />
              </button>
            </div>

            {/* Content */}
            <div style={{ maxHeight: 'calc(64vh - 57px)', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <AnimatePresence mode="wait">
                {activeTab === 'proyecto' && <motion.div key="p" {...fadeUp}><TabProyecto lotes={lotes} stats={stats} areas={areas} /></motion.div>}
                {activeTab === 'filtrar'  && <motion.div key="f" {...fadeUp}><TabFiltrar lotes={lotes} stats={stats} fEstado={fEstado} fTopo={fTopo} toggleEstado={toggleEstado} toggleTopo={toggleTopo} lotesMatch={lotesMatch} hasFilters={hasFilters} resetFilters={resetFilters} /></motion.div>}
                {activeTab === 'zonas'    && <motion.div key="z" {...fadeUp}><TabZonas zonas={zonas} onSelect={z => { setActiveTab(null); onSelectZona?.(z) }} /></motion.div>}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dock ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, ...spring }}
        style={{ ...glass.dock, borderRadius: 20, padding: '6px', display: 'flex', alignItems: 'center', gap: 2, pointerEvents: 'auto' }}
      >
        {TABS.map(({ id, Icon, label }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => toggleTab(id)}
              style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 28px', borderRadius: 14, transition: 'all .2s', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              {/* Active bg */}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  transition={spring}
                  style={{ position: 'absolute', inset: 0, borderRadius: 14, background: 'rgba(154,125,74,0.18)', border: '1px solid rgba(154,125,74,0.28)' }}
                />
              )}

              {/* Filter dot */}
              {id === 'filtrar' && hasFilters && (
                <span style={{ position: 'absolute', top: 8, right: 26, width: 5, height: 5, borderRadius: '50%', background: '#9A7D4A' }} />
              )}

              <Icon
                size={16}
                style={{ position: 'relative', zIndex: 1, color: isActive ? '#C4B49A' : 'rgba(255,255,255,0.32)', transition: 'color .2s' }}
              />
              <span style={{ position: 'relative', zIndex: 1, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isActive ? '#C4B49A' : 'rgba(255,255,255,0.28)', transition: 'color .2s' }}>
                {label}
              </span>
            </button>
          )
        })}
      </motion.div>
    </div>
  )
}

// ── TAB PROYECTO ─────────────────────────────────────────────────────────────
function TabProyecto({ lotes, stats, areas }) {
  return (
    <div style={{ padding: '24px 24px 28px' }}>

      {/* Hero text */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <MapPin size={11} style={{ color: '#C4B49A' }} />
          <span style={{ color: 'rgba(196,180,154,0.6)', fontSize: 10, letterSpacing: '0.1em' }}>Etapa 1 · Venta de lotes</span>
        </div>
        <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, margin: 0 }}>NATIVE</h2>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, marginTop: 6 }}>{lotes.length} lotes · Entrega Dic 2026</p>
      </div>

      {/* Stats grid — referencia */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {Object.entries(ESTADO_CFG).map(([estado, cfg]) => (
          <div key={estado} style={{ ...glass.card, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{stats[estado] ?? 0}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{cfg.label}</div>
          </div>
        ))}
      </div>

      {/* Specs */}
      <div style={{ ...glass.card, padding: '22px 20px', marginBottom: 0 }}>
        {[
          { label: 'Área',   value: `${Math.min(...areas)} – ${Math.max(...areas)} m²` },
          { label: 'Total',  value: `${lotes.length} unidades` },
        ].map(({ label, value, accent }, i, arr) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0' }}>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{label}</span>
              <span style={{ color: accent ? '#C4B49A' : 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 700 }}>{value}</span>
            </div>
            {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />}
          </div>
        ))}
      </div>

    </div>
  )
}

// ── TAB FILTRAR ───────────────────────────────────────────────────────────────
function TabFiltrar({ lotes, stats, fEstado, fTopo, toggleEstado, toggleTopo, lotesMatch, hasFilters, resetFilters }) {
  return (
    <div style={{ padding: '24px 24px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Estado */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Estado</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {ESTADOS.map(e => {
            const cfg    = ESTADO_CFG[e]
            const active = fEstado.includes(e)
            return (
              <button
                key={e}
                onClick={() => toggleEstado(e)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '14px 8px', borderRadius: 12, cursor: 'pointer', transition: 'all .2s',
                  background: active ? `${cfg.color}18` : 'rgba(255,255,255,0.04)',
                  border: active ? `1px solid ${cfg.color}40` : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? cfg.color : 'rgba(255,255,255,0.15)' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: active ? cfg.color : 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{e}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: active ? cfg.color : 'rgba(255,255,255,0.5)' }}>{stats[e]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Topografía */}
      <div>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>Topografía</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {TOPOS.map(t => {
            const active = fTopo.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleTopo(t)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer', transition: 'all .2s',
                  fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                  background: active ? 'rgba(196,180,154,0.12)' : 'rgba(255,255,255,0.04)',
                  border: active ? '1px solid rgba(196,180,154,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  color: active ? '#C4B49A' : 'rgba(255,255,255,0.35)',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Resultado */}
      <div style={{ ...glass.card, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: lotesMatch > 0 ? 'rgba(154,125,74,0.10)' : 'rgba(255,255,255,0.04)', border: lotesMatch > 0 ? '1px solid rgba(154,125,74,0.2)' : '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <span style={{ fontSize: 36, fontWeight: 800, color: lotesMatch > 0 ? '#9A7D4A' : 'rgba(255,255,255,0.18)', lineHeight: 1 }}>{lotesMatch}</span>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginTop: 4 }}>
            {lotesMatch === 1 ? 'lote coincide' : 'lotes coinciden'}
          </p>
        </div>
        {hasFilters && (
          <button
            onClick={resetFilters}
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', background: 'transparent', cursor: 'pointer', transition: 'all .2s' }}
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  )
}

// ── TAB ZONAS ─────────────────────────────────────────────────────────────────
const ZONA_INFO = {
  EM: { emoji: '⛪', hours: 'Acceso libre' },
  PM: { emoji: '🛡️', hours: '24 / 7'      },
  CD: { emoji: '🏊', hours: '6am – 9pm'   },
  E:  { emoji: '🍽️', hours: '8am – 11pm'  },
  CG: { emoji: '💻', hours: '7am – 10pm'  },
}

function TabZonas({ zonas, onSelect }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>Amenidades del proyecto</p>

      {zonas.map(zona => {
        const info   = ZONA_INFO[zona.codigo] ?? { emoji: '📍', hours: '' }
        const isOpen = expanded === zona.id

        return (
          <div key={zona.id} style={{ ...glass.card, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* Fila principal — expande/colapsa */}
              <button
                onClick={() => setExpanded(isOpen ? null : zona.id)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                {/* Badge */}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(196,180,154,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#C4B49A', fontSize: 9, fontWeight: 800 }}>{zona.codigo}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, margin: 0 }}>{zona.nombre}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <Clock size={9} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{info.hours}</span>
                  </div>
                </div>
                <span style={{ fontSize: 18, opacity: isOpen ? 1 : 0.35, transition: 'opacity .2s' }}>{info.emoji}</span>
                <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.18)', flexShrink: 0, transform: isOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }} />
              </button>

              {/* Botón "Ver en mapa" */}
              <button
                onClick={() => onSelect?.(zona)}
                title="Ver en mapa"
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                  padding: '8px 12px', marginRight: 8, borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(196,180,154,0.08)', border: '1px solid rgba(196,180,154,0.22)',
                  color: '#C4B49A', fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                  transition: 'all .18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,180,154,0.18)'; e.currentTarget.style.borderColor = 'rgba(196,180,154,0.45)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(196,180,154,0.08)'; e.currentTarget.style.borderColor = 'rgba(196,180,154,0.22)' }}
              >
                <MapPin size={10} />
                Ver
              </button>
            </div>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 14px 14px 62px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: 11, lineHeight: 1.6, margin: '12px 0 0' }}>{zona.descripcion}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
