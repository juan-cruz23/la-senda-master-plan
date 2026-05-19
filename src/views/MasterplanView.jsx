import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { ZoomIn, ZoomOut, Maximize2, LogIn, LogOut, Loader2, Expand, Shrink } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

import zonas        from '../data/zonas.json'
import lotesInit    from '../data/lotes.json'
import ZonasSVG     from '../components/ZonasSVG'
import LoteMarkers  from '../components/LoteMarkers'
import BottomNav    from '../components/BottomNav'
import ZonaPanel    from '../components/ZonaPanel'
import ZonaPopup    from '../components/ZonaPopup'
import ZonaGallery  from '../components/ZonaGallery'
import LotePanel, { PANEL_W } from '../components/LotePanel'
import { supabase }  from '../lib/supabase'

const IMAGEN = '/PLANTA COMERCIAL.jpg'
const F = { fontFamily: 'Inter, system-ui, sans-serif' }

/* ── Modal de login ─────────────────────────────────────────────────────────── */
function LoginModal({ onClose, onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('Credenciales incorrectas'); setLoading(false) }
    else { onLogin(); onClose() }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.form onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        style={{ background: 'rgba(10,22,34,0.98)', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20, padding: '32px 28px', width: 320,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase', ...F }}>Acceso comercial</p>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 700, ...F }}>Iniciar sesión</h2>
        </div>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          required autoFocus
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 13, outline: 'none', ...F }} />
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
          required
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 13, outline: 'none', ...F }} />
        {error && <p style={{ margin: 0, color: '#ff6b6b', fontSize: 12, ...F }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', borderRadius: 11, border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: '#C4B49A', color: '#0a1622', fontSize: 13, fontWeight: 700, ...F }}>
          {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <LogIn size={14} />}
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </motion.form>
    </motion.div>
  )
}

export default function MasterplanView() {
  const isMobile = useIsMobile()
  const [imgNatural, setImgNatural]    = useState(null)
  const [filters, setFilters]          = useState({ estado: [], topo: [] })
  const [lotes, setLotes]              = useState(() => lotesInit.map(l => ({ ...l })))
  const [selectedLote, setSelectedLote] = useState(null)
  const [zonaTooltip, setZonaTooltip]  = useState(null)
  const [zonePopup,   setZonePopup]    = useState(null)
  const [galleryZona, setGalleryZona]  = useState(null)
  const [clickedZona, setClickedZona]  = useState(null)
  const [session,     setSession]      = useState(null)
  const [showLogin,   setShowLogin]    = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const transformRef = useRef(null)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Cargar sesión activa y estados desde Supabase al montar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))

    // Cargar estados desde Supabase
    supabase.from('lote_estados').select('id, estado').then(({ data }) => {
      if (!data) return
      const map = Object.fromEntries(data.map(r => [r.id, r.estado]))
      setLotes(prev => prev.map(l => ({ ...l, estado: map[l.id] ?? l.estado })))
    })

    return () => subscription.unsubscribe()
  }, [])

  // Cerrar LotePanel al hacer click fuera de él (el lightbox maneja su propio cierre)
  useEffect(() => {
    if (!selectedLote) return
    const handler = e => {
      const panel    = document.getElementById('lote-panel')
      const lightbox = document.getElementById('lote-lightbox')
      if (panel    && panel.contains(e.target))    return
      if (lightbox && lightbox.contains(e.target)) return
      setSelectedLote(null)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [selectedLote])

  // Cerrar panels de zona con Esc
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') {
        setGalleryZona(null); setClickedZona(null); setZonePopup(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Cambia el estado de un lote y persiste en Supabase
  const handleEstadoChange = useCallback(async (id, newEstado) => {
    if (!session) return                                    // solo si está logueado
    setLotes(prev => prev.map(l => l.id === id ? { ...l, estado: newEstado } : l))
    setSelectedLote(prev => prev?.id === id ? { ...prev, estado: newEstado } : prev)
    await supabase.from('lote_estados').update({ estado: newEstado }).eq('id', id)
  }, [session])

  // Zoom suave hacia un punto del canvas
  const getFitScale = useCallback((w, h) =>
    Math.max(window.innerWidth / w, window.innerHeight / h), [])

  const zoomToPoint = useCallback((cx, cy, withPanel = false) => {
    if (!transformRef.current || !imgNatural) return
    const fitS    = Math.max(window.innerWidth / imgNatural.w, window.innerHeight / imgNatural.h)
    const scale   = Math.min(fitS * 4, 6)
    const visibleW = window.innerWidth - (withPanel ? PANEL_W : 0)
    const posX    = visibleW / 2 - cx * scale
    const posY    = window.innerHeight / 2 - cy * scale
    transformRef.current.setTransform(posX, posY, scale, 600, 'easeOut')
  }, [imgNatural])

  const handleSelectLote = useCallback((lote) => {
    setSelectedLote(lote)
    setZonePopup(null)
    if (lote) zoomToPoint(lote.cx, lote.cy, true)
  }, [zoomToPoint])

  const handleImgLoad = useCallback((e) => {
    const { naturalWidth: w, naturalHeight: h } = e.target
    setImgNatural({ w, h })
  }, [])

  const clampBounds = useCallback((ref) => {
    if (!imgNatural) return
    const { positionX, positionY, scale } = ref.state
    const vw = window.innerWidth, vh = window.innerHeight
    const sw = imgNatural.w * scale, sh = imgNatural.h * scale
    const minX = sw < vw ? (vw - sw) / 2 : vw - sw
    const maxX = sw < vw ? (vw - sw) / 2 : 0
    const minY = sh < vh ? (vh - sh) / 2 : vh - sh
    const maxY = sh < vh ? (vh - sh) / 2 : 0
    const nx = Math.min(maxX, Math.max(minX, positionX))
    const ny = Math.min(maxY, Math.max(minY, positionY))
    if (Math.abs(nx - positionX) > 0.5 || Math.abs(ny - positionY) > 0.5)
      ref.setTransform(nx, ny, scale, 250, 'easeOut')
  }, [imgNatural])

  const fitScale = imgNatural ? getFitScale(imgNatural.w, imgNatural.h) : 1

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#59663A' }}>

      {/* Imagen oculta para dimensiones naturales */}
      {!imgNatural && (
        <img src={IMAGEN} onLoad={handleImgLoad}
          className="absolute opacity-0 pointer-events-none"
          style={{ width: 1, height: 1 }} alt="" />
      )}

      {/* Loading */}
      <AnimatePresence>
        {!imgNatural && (
          <motion.div exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-3">
            <div className="w-8 h-8 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
            <p className="text-cream/30 text-xs tracking-widest uppercase">Cargando mapa…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas principal — se comprime cuando el panel está abierto */}
      {imgNatural && (
        <div
          onClick={() => setZonePopup(null)}
          style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            // En móvil el panel superpone el mapa, no lo comprime
            right: (!isMobile && selectedLote) ? PANEL_W : 0,
            transition: 'right 0.38s cubic-bezier(0.4,0,0.2,1)',
          }}>
        <TransformWrapper
          ref={transformRef}
          key={`${imgNatural.w}x${imgNatural.h}`}
          initialScale={fitScale}
          initialPositionX={(window.innerWidth  - imgNatural.w * fitScale) / 2}
          initialPositionY={(window.innerHeight - imgNatural.h * fitScale) / 2}
          minScale={fitScale}
          maxScale={Math.min(fitScale * 4, 6)}
          limitToBounds={false}
          smooth
          wheel={{ disabled: true }}
          pinch={{ step: 8 }}
          doubleClick={{ disabled: true }}
          panning={{ excluded: ['input', 'button', 'textarea'] }}
          onPanningStop={clampBounds}
          onZoomStop={clampBounds}
        >
          {({ zoomIn, zoomOut }) => (
            <>
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ position: 'relative', lineHeight: 0 }}
              >
                <div style={{ width: imgNatural.w, height: imgNatural.h, position: 'relative' }}>
                  <img src={IMAGEN} alt="Masterplan NATIVE"
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    draggable={false} />

                  <svg viewBox={`0 0 ${imgNatural.w} ${imgNatural.h}`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'all' }}>
                    <ZonasSVG
                      zonas={zonas}
                      imgW={imgNatural.w}
                      imgH={imgNatural.h}
                      onZoom={zoomToPoint}
                      onSelect={(zona) => {
                          if (zona.id === 'E') return
                          setZonaTooltip(null)
                          setZonePopup(null)
                          setSelectedLote(null)   // cierra panel de lote si estaba abierto
                          zoomToPoint(zona.cx, zona.cy)
                          const fitS  = Math.min(window.innerWidth / imgNatural.w, window.innerHeight / imgNatural.h)
                          const scale = Math.min(fitS * 4, 6)
                          const haloR = Math.round(imgNatural.w * 0.008 * 1.7 * scale)
                          setTimeout(() => setZonePopup({ zona, offset: haloR + 16 }), 480)
                        }}
                      onHover={(zona, x, y) => setZonaTooltip({ zona, x, y })}
                      onHoverEnd={() => setZonaTooltip(null)}
                    />
                    <LoteMarkers
                      lotes={lotes}
                      imgW={imgNatural.w}
                      selectedId={selectedLote?.id}
                      onSelect={handleSelectLote}
                      filters={filters}
                    />
                  </svg>

                </div>
              </TransformComponent>

              {/* ── UI flotante ── */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none' }}>

                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between pointer-events-none">
                  <div className="flex flex-col gap-3" style={{ pointerEvents: 'none', alignItems: 'flex-start' }}>
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      style={{ pointerEvents: 'auto' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '6px 16px', borderRadius: 16,
                        background: 'rgba(11,30,45,0.80)',
                        backdropFilter: 'blur(72px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(72px) saturate(180%)',
                        border: '1px solid rgba(196,180,154,0.20)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.07)',
                      }}>
                        <img src="/logo.png" alt="NATIVE"
                          style={{ width: 200, height: 'auto', display: 'block' }} />
                      </div>
                    </motion.div>
                  </div>

                </div>

                {/* Botones esquina inferior derecha */}
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                  style={{ position: 'absolute', right: 16, bottom: isMobile ? 100 : 24, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'auto' }}
                >
                  {/* Pantalla completa */}
                  <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: isFullscreen ? 'rgba(196,180,154,0.15)' : 'rgba(11,30,45,0.80)',
                      backdropFilter: 'blur(72px) saturate(180%)', WebkitBackdropFilter: 'blur(72px) saturate(180%)',
                      border: isFullscreen ? '1px solid rgba(196,180,154,0.4)' : '1px solid rgba(196,180,154,0.20)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.25)', color: isFullscreen ? '#C4B49A' : 'rgba(255,255,255,0.45)' }}>
                    {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
                  </button>
                  {/* Login / logout */}
                  <button
                    onClick={() => session ? supabase.auth.signOut() : setShowLogin(true)}
                    title={session ? 'Cerrar sesión' : 'Iniciar sesión'}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                    style={{ background: session ? 'rgba(78,205,196,0.15)' : 'rgba(11,30,45,0.80)',
                      backdropFilter: 'blur(72px) saturate(180%)', WebkitBackdropFilter: 'blur(72px) saturate(180%)',
                      border: session ? '1px solid rgba(78,205,196,0.4)' : '1px solid rgba(196,180,154,0.20)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.25)', color: session ? '#4ECDC4' : 'rgba(255,255,255,0.45)' }}>
                    {session ? <LogOut size={14} /> : <LogIn size={14} />}
                  </button>
                </motion.div>

                {/* Controles de zoom */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{ position: 'absolute', left: 16, bottom: isMobile ? 100 : 24, display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  {[
                    { icon: <ZoomIn size={15} />,   action: () => zoomIn(0.5),  label: 'Zoom +' },
                    { icon: <ZoomOut size={15} />,  action: () => zoomOut(0.5), label: 'Zoom −' },
                    { icon: <Maximize2 size={14} />, action: () => {
                        const fit = getFitScale(imgNatural.w, imgNatural.h)
                        transformRef.current?.setTransform(
                          (window.innerWidth  - imgNatural.w * fit) / 2,
                          (window.innerHeight - imgNatural.h * fit) / 2,
                          fit, 300)
                      }, label: 'Ajustar' },
                  ].map(({ icon, action, label }) => (
                    <button key={label} onClick={action} title={label}
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white/80 transition-all"
                      style={{ background: 'rgba(11,30,45,0.80)', backdropFilter: 'blur(72px) saturate(180%)', WebkitBackdropFilter: 'blur(72px) saturate(180%)', border: '1px solid rgba(196,180,154,0.20)', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', pointerEvents: 'auto' }}>
                      {icon}
                    </button>
                  ))}
                </motion.div>

                {/* Nav inferior */}
                <BottomNav
                  lotes={lotes}
                  onFiltersChange={setFilters}
                  onResetEstados={() => {
                    localStorage.removeItem(LS_KEY)
                    setLotes(lotesInit.map(l => ({ ...l, estado: 'disponible' })))
                    setSelectedLote(prev => prev ? { ...prev, estado: 'disponible' } : null)
                  }}
                  onSelectZona={zona => {
                    if (zona.id === 'E') return
                    setZonaTooltip(null)
                    setZonePopup(null)
                    setSelectedLote(null)
                    zoomToPoint(zona.cx, zona.cy)
                    const fitS  = Math.min(window.innerWidth / imgNatural.w, window.innerHeight / imgNatural.h)
                    const scale = Math.min(fitS * 4, 6)
                    const haloR = Math.round(imgNatural.w * 0.008 * 1.7 * scale)
                    setTimeout(() => setZonePopup({ zona, offset: haloR + 16 }), 480)
                  }}
                />


              </div>{/* fin UI flotante */}
            </>
          )}
        </TransformWrapper>
        </div>
      )}

      {/* ── Panel lateral de lote ── */}
      <LotePanel
        lote={selectedLote}
        onClose={() => setSelectedLote(null)}
        onEstadoChange={handleEstadoChange}
        canEdit={!!session}
      />

      {/* ── Popup resumen de zona ── */}
      <ZonaPopup
        zona={zonePopup?.zona}
        offset={zonePopup?.offset}
        onClose={() => setZonePopup(null)}
        onOpenPanel={() => { setGalleryZona(zonePopup?.zona); setZonePopup(null) }}
      />

      {/* ── Galería central de zona ── */}
      <ZonaGallery zona={galleryZona} onClose={() => setGalleryZona(null)} />

      {/* ── Panel lateral de zona (completo) ── */}
      <ZonaPanel zona={clickedZona} onClose={() => setClickedZona(null)} />

      {/* ── Tooltip hover de zona ── */}
      {zonaTooltip && (
        <div style={{
          position: 'fixed',
          left: zonaTooltip.x + 16,
          top:  zonaTooltip.y - 12,
          zIndex: 9999,
          pointerEvents: 'none',
          background: 'rgba(11,30,45,0.82)',
          backdropFilter: 'blur(72px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(160%)',
          border: `1px solid ${zonaTooltip.zona.color}55`,
          borderRadius: 14,
          padding: '10px 14px',
          minWidth: 160,
          boxShadow: `0 16px 48px rgba(0,0,0,0.5)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: zonaTooltip.zona.color, flexShrink: 0 }} />
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{zonaTooltip.zona.nombre}</span>
          </div>
        </div>
      )}

      {/* ── Modal login ── */}
      <AnimatePresence>
        {showLogin && (
          <LoginModal onClose={() => setShowLogin(false)} onLogin={() => setShowLogin(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
