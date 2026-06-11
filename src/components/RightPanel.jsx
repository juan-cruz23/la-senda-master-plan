import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutGrid, SlidersHorizontal, Landmark,
  ChevronRight, ChevronLeft,
  Phone, CalendarDays,
  CheckCircle2, Circle,
  MapPin, Clock,
} from 'lucide-react'

import lotes from '../data/lotes.json'
import zonas from '../data/zonas.json'

// ── Stats calculadas desde los datos reales ───────────────────────────────────
const stats = lotes.reduce(
  (acc, l) => { acc[l.estado] = (acc[l.estado] || 0) + 1; return acc },
  { disponible: 0, reservado: 0, vendido: 0 }
)
const precios = lotes.map(l => l.precio)
const areas   = lotes.map(l => l.area)
const fmt     = n => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
const fmtM    = n => `$${Math.round(n / 1_000_000)}M`

const TABS = [
  { id: 'proyecto', Icon: LayoutGrid,      label: 'Proyecto' },
  { id: 'filtrar',  Icon: SlidersHorizontal, label: 'Filtrar'  },
  { id: 'zonas',    Icon: Landmark,         label: 'Zonas'    },
]

const ESTADOS = ['disponible', 'reservado', 'vendido']
const TOPOS   = ['plano', 'ondulado', 'inclinado']

const ESTADO_CFG = {
  disponible: { dot: 'bg-moss',      text: 'text-moss',      border: 'border-moss/40',      bg: 'bg-moss/15'      },
  reservado:  { dot: 'bg-amber-400', text: 'text-amber-300', border: 'border-amber-400/40', bg: 'bg-amber-400/15' },
  vendido:    { dot: 'bg-red-500',   text: 'text-red-400',   border: 'border-red-500/40',   bg: 'bg-red-500/15'   },
}

export default function RightPanel({ onFiltersChange }) {
  const [open, setOpen]     = useState(true)
  const [tab, setTab]       = useState('proyecto')

  // Estado de filtros
  const [fEstado, setFEstado] = useState([])
  const [fEtapa,  setFEtapa]  = useState([])
  const [fTopo,   setFTopo]   = useState([])
  const [fArea,   setFArea]   = useState([Math.min(...areas), Math.max(...areas)])
  const [fPrecio, setFPrecio] = useState([Math.min(...precios), Math.max(...precios)])

  const toggleEstado = (e) => {
    const next = fEstado.includes(e) ? fEstado.filter(x => x !== e) : [...fEstado, e]
    setFEstado(next)
    onFiltersChange?.({ estado: next, etapa: fEtapa, topo: fTopo })
  }
  const toggleEtapa = (e) => {
    const next = fEtapa.includes(e) ? fEtapa.filter(x => x !== e) : [...fEtapa, e]
    setFEtapa(next)
    onFiltersChange?.({ estado: fEstado, etapa: next, topo: fTopo })
  }
  const toggleTopo = (t) => {
    const next = fTopo.includes(t) ? fTopo.filter(x => x !== t) : [...fTopo, t]
    setFTopo(next)
    onFiltersChange?.({ estado: fEstado, etapa: fEtapa, topo: next })
  }
  const resetFilters = () => {
    setFEstado([]); setFEtapa([]); setFTopo([])
    onFiltersChange?.({ estado: [], etapa: [], topo: [] })
  }

  const lotesMatch = lotes.filter(l =>
    (fEstado.length === 0 || fEstado.includes(l.estado)) &&
    (fEtapa.length  === 0 || fEtapa.includes(l.etapa)) &&
    (fTopo.length   === 0 || fTopo.includes(l.topografia))
  ).length

  return (
    <div className="absolute right-0 top-0 bottom-0 z-30 flex items-center pointer-events-none">

      {/* Toggle tab */}
      <motion.button
        className="pointer-events-auto flex flex-col items-center justify-center gap-1.5
          w-7 h-24 rounded-l-xl bg-forest-900/85 backdrop-blur-xl
          border border-r-0 border-white/10 shadow-xl
          text-white/40 hover:text-white/80 transition-colors"
        onClick={() => setOpen(o => !o)}
        animate={{ x: open ? 0 : 0 }}
      >
        {open
          ? <ChevronRight size={14} />
          : <ChevronLeft  size={14} />
        }
      </motion.button>

      {/* Panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0,   opacity: 1 }}
            exit={{   x: 320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="pointer-events-auto h-full flex flex-col"
            style={{ width: 320 }}
          >
            <div className="h-full flex flex-col bg-forest-900/90 backdrop-blur-2xl border-l border-white/10 shadow-2xl overflow-hidden">

              {/* Tabs header */}
              <div className="flex border-b border-white/8 flex-shrink-0">
                {TABS.map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3.5 text-[10px] font-semibold uppercase tracking-widest transition-all
                      ${tab === id
                        ? 'text-sage border-b-2 border-sage bg-sage/5'
                        : 'text-white/30 hover:text-white/60 border-b-2 border-transparent'
                      }`}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <AnimatePresence mode="wait">
                  {tab === 'proyecto' && <TabProyecto key="proyecto" stats={stats} areas={areas} precios={precios} />}
                  {tab === 'filtrar'  && <TabFiltrar  key="filtrar"  fEstado={fEstado} fTopo={fTopo} toggleEstado={toggleEstado} toggleTopo={toggleTopo} lotesMatch={lotesMatch} resetFilters={resetFilters} />}
                  {tab === 'zonas'    && <TabZonas    key="zonas"    zonas={zonas} />}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── TAB: PROYECTO ─────────────────────────────────────────────────────────────
function TabProyecto({ stats, areas, precios }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="p-5 space-y-5"
    >
      {/* Encabezado proyecto */}
      <div>
        <p className="text-white/35 text-[10px] uppercase tracking-widest mb-1">Proyecto</p>
        <h2 className="text-white text-2xl font-bold tracking-tight">LA SENDA</h2>
        <p className="text-sage/70 text-xs mt-0.5">Etapa 1 · Venta de lotes</p>
      </div>

      {/* Contadores por estado */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(ESTADO_CFG).map(([estado, cfg]) => (
          <div key={estado} className={`rounded-xl p-3 border ${cfg.bg} ${cfg.border}`}>
            <div className={`text-xl font-bold ${cfg.text}`}>{stats[estado] ?? 0}</div>
            <div className="text-white/40 text-[10px] capitalize mt-0.5">{estado}</div>
          </div>
        ))}
      </div>

      {/* Specs */}
      <div className="space-y-2.5 bg-white/4 rounded-2xl p-4">
        <SpecRow label="Área lotes" value={`${Math.min(...areas)} – ${Math.max(...areas)} m²`} />
        <div className="h-px bg-white/6" />
        <SpecRow label="Precio desde" value={fmtM(Math.min(...precios))} highlight />
        <div className="h-px bg-white/6" />
        <SpecRow label="Precio hasta" value={fmtM(Math.max(...precios))} />
        <div className="h-px bg-white/6" />
        <SpecRow label="Total lotes"  value={`${lotes.length} unidades`} />
        <div className="h-px bg-white/6" />
        <SpecRow label="Entrega"      value="Dic 2026" />
      </div>

      {/* Highlights */}
      <div className="space-y-2">
        {[
          '63 lotes desde 200 m²',
          '5 zonas de amenidades',
          'Vías pavimentadas internas',
          'Agua, luz y fibra óptica',
          'Seguridad 24/7',
        ].map(h => (
          <div key={h} className="flex items-center gap-2.5">
            <CheckCircle2 size={13} className="text-moss flex-shrink-0" />
            <span className="text-white/60 text-xs">{h}</span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="space-y-2.5 pt-1">
        <button className="w-full flex items-center justify-center gap-2 bg-moss hover:bg-moss-light transition-colors text-white font-semibold text-sm py-3 rounded-xl shadow-lg">
          <Phone size={15} />
          Hablar con un asesor
        </button>
        <button className="w-full flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 transition-colors text-white/80 font-medium text-sm py-3 rounded-xl">
          <CalendarDays size={15} />
          Agendar visita
        </button>
      </div>
    </motion.div>
  )
}

// ── TAB: FILTRAR ──────────────────────────────────────────────────────────────
function TabFiltrar({ fEstado, fTopo, toggleEstado, toggleTopo, lotesMatch, resetFilters }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="p-5 space-y-6"
    >
      {/* Estado */}
      <div>
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Estado</p>
        <div className="flex flex-col gap-2">
          {ESTADOS.map(e => {
            const cfg     = ESTADO_CFG[e]
            const active  = fEstado.includes(e)
            return (
              <button
                key={e}
                onClick={() => toggleEstado(e)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left
                  ${active ? `${cfg.bg} ${cfg.border}` : 'bg-white/4 border-white/8 hover:bg-white/8'}`}
              >
                {active
                  ? <CheckCircle2 size={15} className={cfg.text} />
                  : <Circle       size={15} className="text-white/20" />
                }
                <span className={`text-sm font-medium capitalize ${active ? cfg.text : 'text-white/50'}`}>
                  {e}
                </span>
                <span className="ml-auto text-white/25 text-xs">{stats[e]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Topografía */}
      <div>
        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Topografía</p>
        <div className="flex gap-2 flex-wrap">
          {TOPOS.map(t => {
            const active = fTopo.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleTopo(t)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-medium capitalize transition-all
                  ${active
                    ? 'bg-sage/15 border-sage/50 text-sage'
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60'
                  }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Resultado */}
      <div className={`rounded-2xl p-4 text-center border ${
        lotesMatch > 0 ? 'bg-moss/10 border-moss/20' : 'bg-white/4 border-white/8'
      }`}>
        <span className={`text-3xl font-bold ${lotesMatch > 0 ? 'text-moss' : 'text-white/20'}`}>
          {lotesMatch}
        </span>
        <p className="text-white/40 text-xs mt-1">
          {lotesMatch === 1 ? 'lote coincide' : 'lotes coinciden'}
        </p>
        {(fEstado.length > 0 || fTopo.length > 0) && (
          <button
            onClick={resetFilters}
            className="mt-3 text-white/30 hover:text-white/60 text-[10px] underline transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <p className="text-white/20 text-[10px] text-center leading-relaxed">
        Los lotes que no coincidan se opacarán en el mapa al trazar los polígonos
      </p>
    </motion.div>
  )
}

// ── TAB: ZONAS ────────────────────────────────────────────────────────────────
function TabZonas({ zonas }) {
  const [expanded, setExpanded] = useState(null)

  const ZONA_INFO = {
    EM: { emoji: '⛪', hours: 'Acceso libre' },
    PM: { emoji: '🛡️', hours: '24 / 7' },
    CD: { emoji: '🏊', hours: '6am – 9pm' },
    E:  { emoji: '🍽️', hours: '8am – 11pm' },
    CG: { emoji: '💻', hours: '7am – 10pm' },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="p-5 space-y-2.5"
    >
      <p className="text-white/35 text-[10px] uppercase tracking-widest mb-4">Amenidades del proyecto</p>

      {zonas.map((zona) => {
        const info   = ZONA_INFO[zona.codigo] ?? { emoji: '📍', hours: '' }
        const isOpen = expanded === zona.id

        return (
          <div key={zona.id} className="rounded-2xl border border-white/8 bg-white/4 overflow-hidden">
            <button
              className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-white/4 transition-colors"
              onClick={() => setExpanded(isOpen ? null : zona.id)}
            >
              {/* Badge */}
              <div className="w-10 h-10 rounded-xl bg-black/40 border border-sage/50 flex items-center justify-center flex-shrink-0">
                <span className="text-sage text-[10px] font-bold">{zona.codigo}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium leading-tight">{zona.nombre}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={10} className="text-white/25 flex-shrink-0" />
                  <span className="text-white/35 text-[10px]">{info.hours}</span>
                </div>
              </div>
              <ChevronRight
                size={14}
                className={`text-white/25 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden"
                >
                  <div className="px-3.5 pb-3.5 pt-0">
                    <div className="h-px bg-white/6 mb-3" />
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{info.emoji}</span>
                      <p className="text-white/50 text-xs leading-relaxed">{zona.descripcion}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </motion.div>
  )
}

// ── Helper ────────────────────────────────────────────────────────────────────
function SpecRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40 text-xs">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-sage' : 'text-white/80'}`}>{value}</span>
    </div>
  )
}
