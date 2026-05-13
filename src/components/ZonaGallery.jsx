/**
 * ZonaGallery — fullscreen con editor de tour 360°
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, ImageOff, Rotate3d, Images, Expand, Pencil, Check, Trash2, Save } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { getZoneImages } from '../utils/zoneImages'
import zonesTour from '../data/zonesTour.json'

const F = { fontFamily: 'Inter, system-ui, sans-serif' }

const glass = (extra = {}) => ({
  background: 'rgba(6,14,21,0.62)',
  backdropFilter: 'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.10)',
  ...extra,
})

/* ── Tour helpers ─────────────────────────────────────────────────────────── */
function loadTour(zoneId) {
  try {
    const saved = JSON.parse(localStorage.getItem(`tour_${zoneId}`) ?? 'null')
    if (Array.isArray(saved)) return saved
  } catch {}
  return (zonesTour[zoneId] ?? []).filter(l => typeof l.from === 'number')
}

function saveTour(zoneId, links) {
  localStorage.setItem(`tour_${zoneId}`, JSON.stringify(links))
}

/* ── Visor 360° ───────────────────────────────────────────────────────────── */
function Pano360({ src, color, tourMarkers = [], onMarkerClick, onPanoClick }) {
  const ref        = useRef(null)
  const viewer     = useRef(null)
  const onClickRef = useRef(onPanoClick)
  onClickRef.current = onPanoClick

  useEffect(() => {
    if (!ref.current || !src) return

    const markerHTML = (label) => `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;user-select:none;">
        <div style="
          width:52px;height:52px;border-radius:50%;
          background:rgba(6,14,21,0.72);backdrop-filter:blur(16px);
          border:2px solid ${color ?? '#C4B49A'};
          box-shadow:0 0 24px ${color ?? '#C4B49A'}60,0 4px 16px rgba(0,0,0,0.6);
          display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="${color ?? '#C4B49A'}" stroke-width="2.2"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </div>
        ${label ? `<span style="
          font-family:Inter,system-ui,sans-serif;font-size:10px;font-weight:700;
          letter-spacing:.06em;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,0.9);
          background:rgba(6,14,21,0.65);backdrop-filter:blur(8px);
          padding:2px 8px;border-radius:99px;border:1px solid rgba(255,255,255,0.12);
        ">${label}</span>` : ''}
      </div>`

    Promise.all([
      import('@photo-sphere-viewer/core'),
      import('@photo-sphere-viewer/markers-plugin'),
    ]).then(([{ Viewer }, { MarkersPlugin }]) => {
      import('@photo-sphere-viewer/core/index.css').catch(() => {})
      import('@photo-sphere-viewer/markers-plugin/index.css').catch(() => {})

      const markers = tourMarkers.map(m => ({
        id:       `tour-${m.to}`,
        position: { yaw: `${m.yaw}deg`, pitch: `${m.pitch}deg` },
        html:     markerHTML(m.label),
        anchor:   'bottom center',
        data:     { targetIdx: m.to },
      }))

      viewer.current = new Viewer({
        container: ref.current, panorama: src,
        defaultZoomLvl: 0, navbar: ['zoom', 'fullscreen'],
        touchmoveTwoFingers: false, mousewheelCtrlKey: false,
        loadingColor: color ?? '#C4B49A', loadingTxt: 'Cargando 360°…',
        lang: { zoom: 'Zoom', zoomOut: 'Alejar', zoomIn: 'Acercar', fullscreen: 'Pantalla completa' },
        plugins: [[MarkersPlugin, { markers }]],
      })

      // Captura de click → yaw/pitch en grados
      viewer.current.addEventListener('click', ({ data }) => {
        if (!data.rightclick && onClickRef.current) {
          onClickRef.current({
            yaw:   Math.round(data.yaw   * 180 / Math.PI),
            pitch: Math.round(data.pitch * 180 / Math.PI),
          })
        }
      })

      const mp = viewer.current.getPlugin(MarkersPlugin)
      mp.addEventListener('select-marker', ({ marker }) => {
        onMarkerClick?.(marker.data.targetIdx)
      })
    })

    return () => { viewer.current?.destroy(); viewer.current = null }
  }, [src, color]) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}

/* ── Placeholder ──────────────────────────────────────────────────────────── */
function Empty({ color, label, hint }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: `${color}12`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ImageOff size={26} color={color} opacity={0.4} />
      </div>
      <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 13, margin: 0, ...F }}>{label}</p>
      <p style={{ color: 'rgba(255,255,255,0.10)', fontSize: 11, margin: 0, textAlign: 'center', lineHeight: 1.9, ...F }}>{hint}</p>
    </div>
  )
}

/* ── Galería JPG fullscreen ───────────────────────────────────────────────── */
function PhotoGallery({ images, color, zona }) {
  const [idx,    setIdx]    = useState(0)
  const [failed, setFailed] = useState({})
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => { setIdx(0); setFailed({}); setZoomed(false) }, [images])

  const prev = useCallback(() => setIdx(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIdx(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const fn = e => {
      if (e.key === 'ArrowRight' && !zoomed) next()
      if (e.key === 'ArrowLeft'  && !zoomed) prev()
      if (e.key === 'Escape' && zoomed) setZoomed(false)
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [next, prev, zoomed])

  if (!images.length) return (
    <Empty color={color} label="Sin fotos aún" hint="Agrega archivos en src/assets/zonas/[ID]/" />
  )

  return (
    <>
      <AnimatePresence mode="wait">
        {!failed[idx] ? (
          <motion.img key={images[idx]} src={images[idx]} alt=""
            onError={() => setFailed(f => ({ ...f, [idx]: true }))}
            initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.32 }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <Empty color={color} label="Error al cargar" hint="" />
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.70) 100%)', pointerEvents: 'none' }} />

      {images.length > 1 && (
        <>
          <button onClick={prev} style={arrowBtn('left')}><ChevronLeft size={22} /></button>
          <button onClick={next} style={arrowBtn('right')}><ChevronRight size={22} /></button>
        </>
      )}

      <div style={{ position: 'absolute', top: 76, right: 20, display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={() => setZoomed(true)}
          style={{ ...glass({ borderRadius: 8 }), display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', color: 'rgba(255,255,255,0.75)', fontSize: 10.5, fontWeight: 600, cursor: 'pointer', border: 'none', ...F }}>
          <Expand size={11} /> Ver tamaño completo
        </button>
        {images.length > 1 && (
          <div style={{ ...glass({ borderRadius: 8, border: 'none' }), padding: '5px 11px', color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, ...F }}>
            {idx + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderRadius: 16,
          ...glass({ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }),
          maxWidth: '75vw', overflowX: 'auto', scrollbarWidth: 'none',
        }}>
          {images.map((src, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 72 : 50, height: i === idx ? 48 : 34,
              borderRadius: 9, padding: 0, flexShrink: 0,
              border: i === idx ? `2.5px solid ${color}` : '2px solid rgba(255,255,255,0.12)',
              overflow: 'hidden', cursor: 'pointer',
              transition: 'all .22s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: i === idx ? `0 0 18px ${color}70` : 'none',
              background: 'rgba(0,0,0,0.4)',
            }}>
              {!failed[i]
                ? <img src={src} alt="" onError={() => setFailed(f => ({ ...f, [i]: true }))} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageOff size={11} color={color} opacity={0.4} /></div>
              }
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {zoomed && !failed[idx] && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,0,0,0.97)' }} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ position: 'fixed', inset: 0, zIndex: 9501, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', background: 'rgba(0,0,0,0.5)' }}>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, ...F }}>Rueda / pellizca para zoom · Arrastra para mover</span>
                <button onClick={() => setZoomed(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, cursor: 'pointer', ...F }}>
                  <X size={12} /> Cerrar
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <TransformWrapper initialScale={1} minScale={0.5} maxScale={8} centerOnInit wheel={{ step: 0.1 }} doubleClick={{ step: 1.5 }}>
                  <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={images[idx]} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', userSelect: 'none' }} draggable={false} />
                  </TransformComponent>
                </TransformWrapper>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/* ── Galería 360° fullscreen + editor de tour ─────────────────────────────── */
function Gallery360({ images360, color, zoneId }) {
  const [idx,        setIdx]        = useState(0)
  const [viewerKey,  setViewerKey]  = useState(0)   // fuerza remount al guardar
  const [tourLinks,  setTourLinks]  = useState(() => loadTour(zoneId))
  const [editMode,   setEditMode]   = useState(false)
  const [pendingPos, setPendingPos] = useState(null) // { yaw, pitch } capturado
  const [targetIdx,  setTargetIdx]  = useState(1)
  const [label,      setLabel]      = useState('')

  // Ref siempre actualizado — evita closures stale en saveLink/deleteLink
  const zoneIdRef = useRef(zoneId)
  zoneIdRef.current = zoneId

  useEffect(() => {
    setIdx(0)
    setTourLinks(loadTour(zoneId))
    setEditMode(false)
    setPendingPos(null)
  }, [zoneId])

  // Resetea el destino cuando cambia el panorama actual
  useEffect(() => {
    const firstValid = images360.findIndex((_, i) => i !== idx)
    setTargetIdx(firstValid >= 0 ? firstValid : 0)
    setPendingPos(null)
  }, [idx, images360.length])

  const prev = useCallback(() => setIdx(i => (i - 1 + images360.length) % images360.length), [images360.length])
  const next = useCallback(() => setIdx(i => (i + 1) % images360.length), [images360.length])

  useEffect(() => {
    if (editMode) return  // en edición las flechas no navegan
    const fn = e => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [next, prev, editMode])

  // Click dentro del visor en modo edición
  const handlePanoClick = useCallback(({ yaw, pitch }) => {
    if (!editMode) return
    setPendingPos({ yaw, pitch })
  }, [editMode])

  const saveLink = () => {
    if (!pendingPos) return
    const id = zoneIdRef.current
    const newLink = { from: idx, to: targetIdx, ...pendingPos, ...(label ? { label } : {}) }
    const updated = [
      ...tourLinks.filter(l => !(l.from === idx && l.to === targetIdx)),
      newLink,
    ]
    setTourLinks(updated)
    saveTour(id, updated)
    setPendingPos(null)
    setLabel('')
    setEditMode(false)
    setViewerKey(v => v + 1)
  }

  const deleteLink = (from, to) => {
    const id = zoneIdRef.current
    const updated = tourLinks.filter(l => !(l.from === from && l.to === to))
    setTourLinks(updated)
    saveTour(id, updated)
    setViewerKey(v => v + 1)
  }

  const cancelEdit = () => { setEditMode(false); setPendingPos(null); setLabel('') }

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  const saveToCode = async () => {
    setSaving(true)
    try {
      await fetch('/api/save-tour', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId: zoneIdRef.current, links: tourLinks }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
    setSaving(false)
  }

  if (!images360.length) return (
    <Empty color={color} label="Sin imágenes 360° aún" hint="Nombra los archivos 360_*.jpg o pano_*.jpg" />
  )

  const currentMarkers = tourLinks.filter(l => l.from === idx)
  const hasTour        = tourLinks.length > 0
  const canEdit        = images360.length > 1

  // Destinos disponibles (todos excepto el actual)
  const destinations = images360.map((_, i) => i).filter(i => i !== idx)

  return (
    <>
      {/* Visor */}
      <div style={{ position: 'absolute', inset: 0, cursor: editMode ? 'crosshair' : 'default' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${idx}-${viewerKey}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Pano360
              src={images360[idx]}
              color={color}
              tourMarkers={editMode ? [] : currentMarkers}
              onMarkerClick={editMode ? undefined : setIdx}
              onPanoClick={editMode ? handlePanoClick : undefined}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flechas — solo sin tour configurado y fuera de edición */}
      {images360.length > 1 && !hasTour && !editMode && (
        <>
          <button onClick={prev} style={arrowBtn('left')}><ChevronLeft size={22} /></button>
          <button onClick={next} style={arrowBtn('right')}><ChevronRight size={22} /></button>
        </>
      )}

      {/* ── Botón Editar tour ── */}
      {canEdit && !editMode && (
        <button
          onClick={() => { setEditMode(true); setPendingPos(null) }}
          style={{
            position: 'absolute', top: 76, left: 20, zIndex: 20,
            ...glass({ borderRadius: 8 }),
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)', fontSize: 10.5, fontWeight: 600, ...F,
          }}
        >
          <Pencil size={11} /> Editar tour
        </button>
      )}

      {/* ── Panel editor ── */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute', top: 76, left: '50%', transform: 'translateX(-50%)',
              zIndex: 20, width: 360,
              ...glass({ borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.7)' }),
              padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            {/* Cabecera del panel */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: color, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', ...F }}>
                Editar tour · Panorama {idx + 1}
              </span>
              <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>

            {/* Instrucción */}
            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 1.7, ...F }}>
                {pendingPos
                  ? <>Posición capturada: <strong style={{ color: '#fff' }}>yaw {pendingPos.yaw}° · pitch {pendingPos.pitch}°</strong></>
                  : '👆 Haz click en el panorama donde quieres colocar la flecha'
                }
              </p>
            </div>

            {/* Destino */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: 'rgba(255,255,255,0.40)', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', ...F }}>
                Conectar con
              </label>
              <select
                value={targetIdx}
                onChange={e => setTargetIdx(Number(e.target.value))}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 8, padding: '7px 10px', color: '#fff', fontSize: 12, ...F, cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {destinations.map(i => (
                  <option key={i} value={i} style={{ background: '#0d1e2d' }}>
                    Panorama {i + 1} ({images360[i].split('/').pop()})
                  </option>
                ))}
              </select>
            </div>

            {/* Etiqueta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: 'rgba(255,255,255,0.40)', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', ...F }}>
                Etiqueta (opcional)
              </label>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="ej: Hacia la piscina"
                style={{
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 8, padding: '7px 10px', color: '#fff', fontSize: 12, ...F,
                  outline: 'none',
                }}
              />
            </div>

            {/* Guardar */}
            <button
              onClick={saveLink}
              disabled={!pendingPos}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px 0', borderRadius: 9, border: 'none', cursor: pendingPos ? 'pointer' : 'not-allowed',
                background: pendingPos ? color : 'rgba(255,255,255,0.07)',
                color: pendingPos ? '#fff' : 'rgba(255,255,255,0.25)',
                fontSize: 12, fontWeight: 700, transition: 'all .18s', ...F,
              }}
            >
              <Check size={13} /> Guardar flecha
            </button>

            {/* Flechas existentes desde este panorama */}
            {tourLinks.filter(l => l.from === idx).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', ...F }}>
                  Flechas en este panorama
                </span>
                {tourLinks.filter(l => l.from === idx).map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 11, ...F }}>
                      → P{l.to + 1} {l.label ? `· "${l.label}"` : ''} <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>(yaw:{l.yaw}° p:{l.pitch}°)</span>
                    </span>
                    <button onClick={() => deleteLink(l.from, l.to)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,80,80,0.5)', display: 'flex', padding: 2 }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Guardar en código */}
            {tourLinks.length > 0 && (
              <button
                onClick={saveToCode}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '8px 0', borderRadius: 9, border: `1px solid ${saved ? '#4ECDC4' : 'rgba(255,255,255,0.12)'}`,
                  background: saved ? 'rgba(78,205,196,0.12)' : 'rgba(255,255,255,0.04)',
                  color: saved ? '#4ECDC4' : 'rgba(255,255,255,0.45)',
                  fontSize: 11, fontWeight: 700, cursor: saving ? 'wait' : 'pointer',
                  transition: 'all .2s', ...F,
                }}
              >
                <Save size={11} />
                {saved ? '¡Guardado en zonesTour.json!' : saving ? 'Guardando…' : 'Guardar en código'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contador + dots */}
      {images360.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 10, alignItems: 'center', padding: '8px 16px', borderRadius: 999,
          ...glass({ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }),
        }}>
          <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 10, fontWeight: 700, ...F, letterSpacing: '0.08em' }}>360°</span>
          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.12)' }} />
          {images360.map((_, i) => (
            <button key={i} onClick={() => { setIdx(i); setPendingPos(null) }} style={{
              width: i === idx ? 24 : 8, height: 8, borderRadius: 4,
              border: 'none', cursor: 'pointer', padding: 0,
              background: i === idx ? color : 'rgba(255,255,255,0.22)',
              transition: 'all .25s',
              boxShadow: i === idx ? `0 0 8px ${color}80` : 'none',
            }} />
          ))}
          <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.12)' }} />
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 600, ...F }}>
            {idx + 1} / {images360.length}
          </span>
        </div>
      )}
    </>
  )
}

/* ── Modal principal ──────────────────────────────────────────────────────── */
export default function ZonaGallery({ zona, onClose }) {
  const [mode, setMode] = useState('pano')
  const { images360, images } = zona ? getZoneImages(zona.id) : { images360: [], images: [] }

  useEffect(() => { setMode('pano') }, [zona?.id])
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  if (!zona) return null

  return (
    <AnimatePresence>
      {zona && (
        <motion.div
          key={zona.id}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'fixed', inset: 0, zIndex: 9300, background: '#060e15', pointerEvents: 'auto', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', inset: 0 }}>
            <AnimatePresence mode="wait">
              {mode === 'pano' ? (
                <motion.div key="pano" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', inset: 0 }}>
                  <Gallery360 key={zona.id} images360={images360} color={zona.color} zoneId={zona.id} />
                </motion.div>
              ) : (
                <motion.div key="photos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ position: 'absolute', inset: 0 }}>
                  <PhotoGallery key={zona.id} images={images} color={zona.color} zona={zona} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Header flotante */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', ...glass({ borderBottom: '1px solid rgba(255,255,255,0.08)', borderRadius: 0 }) }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${zona.color}18`, border: `1.5px solid ${zona.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: zona.color, fontSize: 10, fontWeight: 800, ...F }}>{zona.codigo}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.30)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', ...F }}>Zona común</p>
              <h2 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', ...F }}>{zona.nombre}</h2>
            </div>

            <div style={{ display: 'flex', gap: 4, padding: '3px', borderRadius: 11, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
              {[
                { id: 'pano',   label: '360°',   Icon: Rotate3d },
                { id: 'photos', label: 'Galería', Icon: Images   },
              ].map(({ id, label, Icon }) => {
                const active = mode === id
                return (
                  <button key={id} onClick={() => setMode(id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all .18s', background: active ? `${zona.color}28` : 'transparent', boxShadow: active ? `inset 0 0 0 1.5px ${zona.color}70` : 'none' }}>
                    <Icon size={13} color={active ? zona.color : 'rgba(255,255,255,0.30)'} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: active ? zona.color : 'rgba(255,255,255,0.30)', ...F }}>{label}</span>
                  </button>
                )
              })}
            </div>

            <button onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)', transition: 'all .15s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const arrowBtn = side => ({
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  [side]: 18, width: 46, height: 46, borderRadius: '50%',
  background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.12)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: 'rgba(255,255,255,0.85)', transition: 'all 0.15s', zIndex: 5,
})
