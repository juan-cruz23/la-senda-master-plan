/**
 * CoordPicker — DEV TOOL
 * Modo CENTROS:  click secuencial, genera lotes.json
 * Modo ZONAS:    click sobre cada zona de la lista, genera zonas.json
 * Modo POLÍGONO: traza vértices, doble click cierra y copia JSON
 */
import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Copy, Trash2, CheckCircle, ChevronDown, ChevronUp, Undo2, MapPin } from 'lucide-react'

const PAD = n => String(n).padStart(2, '0')
const makeId = n => `L${PAD(n)}`

const MARKER_COLOR  = '#0D2E40'
const MARKER_BORDER = '#7BBFDA'

// Zonas comunes predefinidas
const ZONAS_DEF = [
  { id: 'Z1', nombre: 'Portería · Mall Comercial',      codigo: 'PC', color: '#B8C89A' },
  { id: 'Z2', nombre: 'Parqueadero Mall Comercial',     codigo: 'PM', color: '#9A7D45' },
  { id: 'Z3', nombre: 'Estancia del Bosque',            codigo: 'EB', color: '#8B9E6E' },
  { id: 'Z4', nombre: 'Parque Lineal',                  codigo: 'PL', color: '#2B7A8C' },
  { id: 'Z5', nombre: 'Estancia Natural',               codigo: 'EN', color: '#B8C89A' },
]

export default function CoordPicker({ imgW, imgH, startNum: initialStartNum = 0 }) {
  const [mode, setMode]           = useState('centros')
  const [cursor, setCursor]       = useState({ x: 0, y: 0 })
  const [panelOpen, setPanelOpen] = useState(true)

  // ── Polígono ──────────────────────────────────────────────────────────────
  const [points, setPoints]     = useState([])
  const [polygons, setPolygons] = useState([])
  const [loteId, setLoteId]     = useState('')

  // ── Centros ───────────────────────────────────────────────────────────────
  const [placements, setPlacements] = useState([])
  const [startNum, setStartNum]     = useState(initialStartNum)

  // ── Zonas ─────────────────────────────────────────────────────────────────
  const [zonaPlacements, setZonaPlacements] = useState([])   // [{...ZONAS_DEF, cx, cy}]
  const [zonaQueue, setZonaQueue]           = useState(ZONAS_DEF.map(z => z.id))  // pendientes

  const [copied, setCopied] = useState(false)

  // ──────────────────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback(e => {
    setCursor({ x: Math.round(e.nativeEvent.offsetX), y: Math.round(e.nativeEvent.offsetY) })
  }, [])

  const handleClick = useCallback(e => {
    if (e.detail >= 2) return
    const x = Math.round(e.nativeEvent.offsetX)
    const y = Math.round(e.nativeEvent.offsetY)

    if (mode === 'centros') {
      setPlacements(prev => {
        const num = startNum + prev.length
        return [...prev, { id: makeId(num), cx: x, cy: y }]
      })
    } else if (mode === 'zonas') {
      if (zonaQueue.length === 0) return
      const nextId = zonaQueue[0]
      const def    = ZONAS_DEF.find(z => z.id === nextId)
      setZonaPlacements(prev => [...prev, { ...def, cx: x, cy: y }])
      setZonaQueue(prev => prev.slice(1))
    } else {
      setPoints(prev => [...prev, { x, y }])
    }
  }, [mode, startNum, zonaQueue])

  const handleDblClick = useCallback(e => {
    if (mode !== 'poligono') return
    e.stopPropagation()
    if (points.length < 3) return
    const ptsStr = points.map(p => `${p.x},${p.y}`).join(' ')
    const id = loteId.trim() || `P${polygons.length + 1}`
    setPolygons(prev => [...prev, { id, puntos: ptsStr }])
    setPoints([])
    copy(JSON.stringify({ id, puntos: ptsStr }, null, 2))
  }, [mode, points, polygons, loteId])

  const copy = text => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  const undoLast = () => setPlacements(p => p.slice(0, -1))

  const undoLastZona = () => {
    setZonaPlacements(prev => {
      if (prev.length === 0) return prev
      const removed = prev[prev.length - 1]
      setZonaQueue(q => [removed.id, ...q])
      return prev.slice(0, -1)
    })
  }

  // JSON lotes
  const jsonLotes = JSON.stringify(
    placements.map(({ id, cx, cy }) => ({
      id,
      nombre: `Lote ${id.replace('L', '')}`,
      area: 0,
      etapa: 'Etapa 1',
      topografia: 'Esencia',
      estado: 'disponible',
      cx, cy,
    })),
    null, 2
  )

  // JSON zonas
  const jsonZonas = JSON.stringify(
    zonaPlacements.map(({ id, nombre, codigo, color, cx, cy }) => ({
      id, nombre, codigo, color, cx, cy,
    })),
    null, 2
  )

  const ptsStr    = points.map(p => `${p.x},${p.y}`).join(' ')
  const doneCount = placements.length
  const nextZona  = zonaQueue.length > 0 ? ZONAS_DEF.find(z => z.id === zonaQueue[0]) : null

  return (
    <>
      {/* Overlay interactivo */}
      <div
        className="absolute inset-0"
        style={{ cursor: 'crosshair', zIndex: 10 }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onDoubleClick={handleDblClick}
      >
        <svg
          viewBox={`0 0 ${imgW} ${imgH}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          {/* Crosshair */}
          <line x1={cursor.x} y1={0} x2={cursor.x} y2={imgH} stroke="#7BBFDA" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="6 5" />
          <line x1={0} y1={cursor.y} x2={imgW} y2={cursor.y} stroke="#7BBFDA" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="6 5" />
          <circle cx={cursor.x} cy={cursor.y} r={4} fill="none" stroke="#7BBFDA" strokeWidth="1.5" strokeOpacity="0.7" />

          {/* ── Lotes colocados ── */}
          {mode === 'centros' && placements.map(({ id, cx, cy }) => {
            const r = imgW * 0.006
            return (
              <g key={id}>
                <circle cx={cx} cy={cy} r={r} fill={MARKER_COLOR} fillOpacity="0.92" stroke={MARKER_BORDER} strokeWidth="2" />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                  fill="#ffffff" fontSize={r * 0.85} fontWeight="800" fontFamily="Inter, sans-serif"
                  style={{ userSelect: 'none' }}>
                  {id.replace('L', '')}
                </text>
              </g>
            )
          })}

          {/* Preview próximo lote */}
          {mode === 'centros' && (
            <>
              <circle cx={cursor.x} cy={cursor.y} r={imgW * 0.006}
                fill={MARKER_COLOR} fillOpacity="0.30" stroke={MARKER_BORDER} strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="4 3" />
              <text x={cursor.x} y={cursor.y} textAnchor="middle" dominantBaseline="central"
                fill="rgba(255,255,255,0.4)" fontSize={imgW * 0.005} fontWeight="800" fontFamily="Inter, sans-serif"
                style={{ userSelect: 'none' }}>
                {PAD(startNum + doneCount)}
              </text>
            </>
          )}

          {/* ── Zonas colocadas ── */}
          {zonaPlacements.map(({ id, codigo, color, cx, cy }) => {
            const r = imgW * 0.009
            return (
              <g key={id}>
                <circle cx={cx} cy={cy} r={r * 1.7} fill={color} fillOpacity="0.12" />
                <circle cx={cx} cy={cy} r={r} fill="rgba(0,0,0,0.65)" stroke={color} strokeWidth="2.5" />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                  fill={color} fontSize={r * 0.75} fontWeight="700" fontFamily="Inter, sans-serif"
                  style={{ userSelect: 'none' }}>
                  {codigo}
                </text>
              </g>
            )
          })}

          {/* Preview próxima zona */}
          {mode === 'zonas' && nextZona && (
            <>
              <circle cx={cursor.x} cy={cursor.y} r={imgW * 0.009 * 1.7}
                fill={nextZona.color} fillOpacity="0.10" />
              <circle cx={cursor.x} cy={cursor.y} r={imgW * 0.009}
                fill="rgba(0,0,0,0.4)" stroke={nextZona.color} strokeWidth="2" strokeOpacity="0.6" strokeDasharray="5 3" />
              <text x={cursor.x} y={cursor.y} textAnchor="middle" dominantBaseline="central"
                fill={nextZona.color} fillOpacity="0.5" fontSize={imgW * 0.007} fontWeight="700" fontFamily="Inter, sans-serif"
                style={{ userSelect: 'none' }}>
                {nextZona.codigo}
              </text>
            </>
          )}

          {/* ── Polígonos cerrados ── */}
          {mode === 'poligono' && polygons.map((poly, i) => (
            <polygon key={i} points={poly.puntos} fill="#9A7D45" fillOpacity="0.22" stroke="#B8C89A" strokeWidth="2" strokeOpacity="0.7" />
          ))}

          {/* ── Vértices activos ── */}
          {mode === 'poligono' && points.map((p, i) => {
            const prev = points[i - 1]
            return (
              <g key={i}>
                {i > 0 && <line x1={prev.x} y1={prev.y} x2={p.x} y2={p.y} stroke="#B8C89A" strokeWidth="2" strokeOpacity="0.85" />}
                <circle cx={p.x} cy={p.y} r={i === 0 ? 7 : 5}
                  fill={i === 0 ? '#B8C89A' : '#9A7D45'} stroke="white" strokeWidth="1.5" fillOpacity="0.9" />
                <text x={p.x + 8} y={p.y - 6} fill="white" fontSize={Math.round(imgW * 0.008)}
                  fontFamily="Inter, monospace" fontWeight="600">{i + 1}</text>
              </g>
            )
          })}
          {mode === 'poligono' && points.length > 0 && (
            <line x1={points[points.length-1].x} y1={points[points.length-1].y} x2={cursor.x} y2={cursor.y}
              stroke="#B8C89A" strokeWidth="1.5" strokeOpacity="0.45" strokeDasharray="7 4" />
          )}
          {mode === 'poligono' && points.length > 2 && (
            <line x1={cursor.x} y1={cursor.y} x2={points[0].x} y2={points[0].y}
              stroke="#B8C89A" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="4 5" />
          )}
        </svg>
      </div>

      {/* Panel de control — portaled to body to escape CSS transform context */}
      {createPortal(<div
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]"
        style={{ pointerEvents: 'auto' }}
        onClick={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
        onMouseMove={e => e.stopPropagation()}
      >
        <motion.div
          className="bg-forest-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 500 }}
          layout
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Crosshair size={13} className="text-moss" />
              <span className="text-white text-xs font-semibold uppercase tracking-widest">Coord Picker</span>
              <span className="text-moss/50 text-[9px] font-mono bg-moss/10 px-1.5 py-0.5 rounded">DEV</span>
              <div className="flex gap-1 ml-2">
                {[['centros','Centros'], ['zonas','Zonas'], ['poligono','Polígono']].map(([m, label]) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all ${
                      mode === m ? 'bg-moss/25 text-moss border border-moss/40' : 'text-white/30 hover:text-white/60 border border-transparent'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-sage text-xs font-mono bg-black/40 px-2.5 py-1 rounded-lg border border-white/5">
                {cursor.x} , {cursor.y}
              </code>
              <button onClick={() => setPanelOpen(o => !o)} className="text-white/30 hover:text-white/70 transition-colors">
                {panelOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {panelOpen && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                transition={{ duration: 0.18 }} className="overflow-hidden">

                {/* ── MODO CENTROS ── */}
                {mode === 'centros' && (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin size={12} className="text-moss flex-shrink-0" />
                      <span className="text-white/40 text-xs flex-shrink-0">Empezar desde</span>
                      <input
                        type="number" min={0} value={startNum}
                        onChange={e => setStartNum(Math.max(0, Number(e.target.value)))}
                        className="w-20 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-moss/60 font-mono"
                      />
                      <span className="text-white/30 text-xs">→ próximo: <strong className="text-white/60">L{PAD(startNum + doneCount)}</strong></span>
                    </div>
                    <div className="bg-black/20 rounded-xl px-3 py-2.5 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-moss flex-shrink-0" />
                      <span className="text-white/50 text-[10px]">
                        <strong className="text-white/75">Click</strong> en el mapa → coloca el lote en secuencia automáticamente
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/40 text-[10px] font-mono flex-shrink-0">{doneCount} lotes colocados</span>
                      {doneCount > 0 && (
                        <button onClick={undoLast}
                          className="flex items-center gap-1 text-white/30 hover:text-amber-400 transition-colors text-[10px] ml-auto">
                          <Undo2 size={10} /> Deshacer último
                        </button>
                      )}
                    </div>
                    {doneCount > 0 && (
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {placements.map(({ id, cx, cy }) => (
                          <div key={id} className="bg-black/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                            <span className="text-[10px] font-bold w-8 flex-shrink-0" style={{ color: MARKER_BORDER }}>{id}</span>
                            <code className="text-white/40 text-[9px] font-mono flex-1">{cx}, {cy}</code>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      {doneCount > 0 && (
                        <button onClick={() => copy(jsonLotes)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-moss/20 hover:bg-moss/30 border border-moss/30 hover:border-moss/50 rounded-xl py-2 text-moss text-xs font-semibold transition-all">
                          {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                          Copiar JSON ({doneCount} lotes)
                        </button>
                      )}
                      {doneCount > 0 && (
                        <button onClick={() => setPlacements([])}
                          className="flex items-center gap-1.5 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 rounded-xl px-3 py-2 text-white/30 hover:text-red-400 text-xs transition-all">
                          <Trash2 size={12} /> Limpiar
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── MODO ZONAS ── */}
                {mode === 'zonas' && (
                  <div className="p-4 space-y-3">

                    {/* Próxima a colocar */}
                    {nextZona ? (
                      <div className="flex items-center gap-3 bg-black/20 rounded-xl px-3 py-2.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: nextZona.color }} />
                        <span className="text-white/50 text-[10px]">
                          Click para colocar → <strong className="text-white/80">{nextZona.nombre}</strong>
                          <span className="ml-2 font-mono text-[9px]" style={{ color: nextZona.color }}>[{nextZona.codigo}]</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-moss/10 rounded-xl px-3 py-2.5 border border-moss/20">
                        <CheckCircle size={12} className="text-moss" />
                        <span className="text-moss text-[10px] font-semibold">Todas las zonas colocadas</span>
                      </div>
                    )}

                    {/* Lista de zonas */}
                    <div className="space-y-1.5">
                      {ZONAS_DEF.map(z => {
                        const placed  = zonaPlacements.find(p => p.id === z.id)
                        const pending = zonaQueue.includes(z.id)
                        const isNext  = zonaQueue[0] === z.id
                        return (
                          <div key={z.id}
                            className={`rounded-xl px-3 py-2 flex items-center gap-2.5 border transition-all ${
                              placed  ? 'bg-black/20 border-white/5' :
                              isNext  ? 'bg-black/30 border-white/15' :
                              'bg-black/10 border-transparent opacity-40'
                            }`}>
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                              style={{ background: z.color + '22', color: z.color, border: `1px solid ${z.color}44` }}>
                              {z.codigo}
                            </span>
                            <span className="text-white/70 text-[10px] flex-1">{z.nombre}</span>
                            {placed
                              ? <code className="text-white/30 text-[9px] font-mono">{placed.cx}, {placed.cy}</code>
                              : isNext
                                ? <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">siguiente</span>
                                : null
                            }
                          </div>
                        )
                      })}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 pt-1">
                      {zonaPlacements.length > 0 && (
                        <button onClick={undoLastZona}
                          className="flex items-center gap-1 text-white/30 hover:text-amber-400 transition-colors text-[10px]">
                          <Undo2 size={10} /> Deshacer último
                        </button>
                      )}
                      <div className="flex-1" />
                      {zonaPlacements.length > 0 && (
                        <button onClick={() => copy(jsonZonas)}
                          className="flex items-center justify-center gap-1.5 bg-moss/20 hover:bg-moss/30 border border-moss/30 hover:border-moss/50 rounded-xl px-3 py-2 text-moss text-xs font-semibold transition-all">
                          {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                          Copiar JSON ({zonaPlacements.length})
                        </button>
                      )}
                      {zonaPlacements.length > 0 && (
                        <button onClick={() => { setZonaPlacements([]); setZonaQueue(ZONAS_DEF.map(z => z.id)) }}
                          className="flex items-center gap-1.5 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 rounded-xl px-3 py-2 text-white/30 hover:text-red-400 text-xs transition-all">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── MODO POLÍGONO ── */}
                {mode === 'poligono' && (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs w-14 flex-shrink-0">ID lote</span>
                      <input type="text" value={loteId} onChange={e => setLoteId(e.target.value)}
                        placeholder="ej: L01"
                        className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs outline-none focus:border-moss/60 placeholder:text-white/20 font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-black/20 rounded-xl p-2.5 flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-sage mt-0.5 flex-shrink-0" />
                        <span className="text-white/50 text-[10px] leading-relaxed"><strong className="text-white/70">Click</strong> → añade vértice</span>
                      </div>
                      <div className="bg-black/20 rounded-xl p-2.5 flex items-start gap-2">
                        <span className="w-2 h-2 rounded-full bg-moss mt-0.5 flex-shrink-0" />
                        <span className="text-white/50 text-[10px] leading-relaxed"><strong className="text-white/70">Doble click</strong> → cierra y copia</span>
                      </div>
                    </div>
                    {points.length > 0 && (
                      <div className="bg-black/20 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/40 text-[10px] uppercase tracking-wider">
                            {points.length} vértice{points.length !== 1 ? 's' : ''} · {loteId || 'sin ID'}
                          </span>
                          <button onClick={() => setPoints(p => p.slice(0, -1))}
                            className="flex items-center gap-1 text-white/30 hover:text-amber-400 transition-colors text-[10px]">
                            <Undo2 size={10} /> deshacer
                          </button>
                        </div>
                        <code className="text-sage/80 text-[10px] font-mono break-all leading-relaxed block">{ptsStr}</code>
                        <button onClick={() => copy(ptsStr)}
                          className="mt-2 flex items-center gap-1.5 text-white/30 hover:text-sage transition-colors text-[10px]">
                          {copied ? <CheckCircle size={11} className="text-moss" /> : <Copy size={11} />}
                          copiar puntos actuales
                        </button>
                      </div>
                    )}
                    {polygons.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-white/30 text-[10px] uppercase tracking-wider block">
                          {polygons.length} polígono{polygons.length > 1 ? 's' : ''} guardado{polygons.length > 1 ? 's' : ''}
                        </span>
                        <div className="space-y-1 max-h-28 overflow-y-auto">
                          {polygons.map((poly, i) => (
                            <div key={i} className="bg-black/20 rounded-lg px-3 py-2 flex items-center gap-2">
                              <span className="text-moss text-[10px] font-bold w-10 flex-shrink-0">{poly.id}</span>
                              <code className="text-white/35 text-[9px] font-mono flex-1 truncate">{poly.puntos}</code>
                              <button onClick={() => copy(poly.puntos)}
                                className="text-white/30 hover:text-sage transition-colors flex-shrink-0">
                                {copied ? <CheckCircle size={11} className="text-moss" /> : <Copy size={11} />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-0.5">
                      {polygons.length > 0 && (
                        <button onClick={() => copy(polygons.map(p => `"${p.id}": "${p.puntos}"`).join('\n'))}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-moss/20 hover:bg-moss/30 border border-moss/30 hover:border-moss/50 rounded-xl py-2 text-moss text-xs font-semibold transition-all">
                          {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                          Exportar todos
                        </button>
                      )}
                      <button onClick={() => { setPoints([]); setPolygons([]) }}
                        className="flex items-center gap-1.5 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 rounded-xl px-3 py-2 text-white/30 hover:text-red-400 text-xs transition-all">
                        <Trash2 size={12} /> Limpiar
                      </button>
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>, document.body)}
    </>
  )
}
