import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Ruler, Mountain, Banknote, ChevronRight } from 'lucide-react'

const ESTADO_CONFIG = {
  disponible: {
    label: 'Disponible',
    bg: 'bg-moss/20',
    border: 'border-moss/60',
    dot: 'bg-moss',
    text: 'text-moss-light',
  },
  reservado: {
    label: 'Reservado',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/50',
    dot: 'bg-amber-400',
    text: 'text-amber-300',
  },
  vendido: {
    label: 'Vendido',
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    dot: 'bg-red-500',
    text: 'text-red-300',
  },
}

const TOPO_ICON = {
  plano: '▬',
  ondulado: '〰',
  inclinado: '⟋',
}

function formatPrecio(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function LoteCard({ lote, anchor, onClose }) {
  if (!lote) return null

  const cfg = ESTADO_CONFIG[lote.estado] ?? ESTADO_CONFIG.disponible

  // Posición de la card: anclar cerca del polígono, evitar bordes
  const cardW = 320
  const cardH = 300
  const vw = window.innerWidth
  const vh = window.innerHeight

  let x = anchor.x + 16
  let y = anchor.y - 60

  if (x + cardW > vw - 16) x = anchor.x - cardW - 16
  if (x < 16) x = 16
  if (y + cardH > vh - 16) y = vh - cardH - 16
  if (y < 16) y = 16

  return (
    <AnimatePresence>
      <motion.div
        key={lote.id}
        initial={{ opacity: 0, scale: 0.88, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        style={{ left: x, top: y, width: cardW }}
        className="fixed z-50 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Fondo glassmorphism */}
        <div className="absolute inset-0 bg-forest-900/80 backdrop-blur-xl" />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
              <h3 className="text-white text-xl font-semibold tracking-tight">{lote.nombre}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/80 transition-colors mt-0.5"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Stat icon={<Ruler size={14} />} label="Área" value={`${lote.area} m²`} />
            <Stat icon={<Mountain size={14} />} label="Topografía" value={`${TOPO_ICON[lote.topografia]} ${lote.topografia}`} />
            <Stat icon={<MapPin size={14} />} label="Frente" value={`${lote.frente} m`} />
          </div>

          {/* Descripción */}
          <p className="text-white/55 text-xs leading-relaxed mb-4">{lote.descripcion}</p>

          {/* CTA */}
          {lote.estado === 'disponible' && (
            <button className="w-full flex items-center justify-center gap-2 bg-moss hover:bg-moss-light transition-colors text-white text-sm font-semibold py-2.5 rounded-xl">
              Solicitar información
              <ChevronRight size={16} />
            </button>
          )}
          {lote.estado !== 'disponible' && (
            <div className="w-full text-center text-white/30 text-xs py-2">
              Este lote no está disponible
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function Stat({ icon, label, value }) {
  return (
    <div className="bg-white/5 rounded-xl p-2.5 flex flex-col gap-1">
      <div className="flex items-center gap-1 text-white/40">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-white text-xs font-medium capitalize">{value}</span>
    </div>
  )
}
