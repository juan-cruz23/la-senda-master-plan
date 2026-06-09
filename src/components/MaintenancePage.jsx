export default function MaintenancePage() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0a1622',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      color: '#c4b49a',
      textAlign: 'center',
      padding: '32px',
    }}>
      {/* Logo / nombre */}
      <div style={{
        fontSize: 11,
        letterSpacing: '0.35em',
        textTransform: 'uppercase',
        color: 'rgba(196,180,154,0.5)',
        marginBottom: 20,
      }}>
        Parcelación
      </div>

      <div style={{
        fontSize: 'clamp(32px, 6vw, 64px)',
        fontWeight: 200,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: '#c4b49a',
        marginBottom: 8,
      }}>
        NATIVE
      </div>

      {/* Separador */}
      <div style={{
        width: 48,
        height: 1,
        background: 'rgba(196,180,154,0.25)',
        marginBottom: 48,
      }} />

      {/* Mensaje */}
      <div style={{
        fontSize: 'clamp(13px, 2vw, 15px)',
        letterSpacing: '0.1em',
        color: 'rgba(196,180,154,0.65)',
        lineHeight: 1.8,
        maxWidth: 380,
      }}>
        El masterplan interactivo estará<br />
        disponible muy pronto.
      </div>
    </div>
  )
}
