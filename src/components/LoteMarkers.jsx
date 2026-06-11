/**
 * LoteMarkers
 * Renderiza los marcadores clicables sobre cada lote que tenga cx/cy definidos.
 * Los marcadores respiran con una animación de doble pulso SVG nativo.
 */

const ESTADO_COLOR = {
  disponible: '#2E4A22',
  reservado:  '#9A7D45',
  vendido:    '#ef4444',
}

export default function LoteMarkers({ lotes, imgW, selectedId, onSelect, filters }) {
  const r = imgW * 0.0052   // radio base proporcional a la imagen

  const isFiltered = filters?.estado?.length > 0 || filters?.etapa?.length > 0 || filters?.topo?.length > 0
  const matches = l =>
    (!filters?.estado?.length || filters.estado.includes(l.estado)) &&
    (!filters?.etapa?.length  || filters.etapa.includes(l.etapa)) &&
    (!filters?.topo?.length   || filters.topo.includes(l.topografia))

  return (
    <g style={{ pointerEvents: 'all' }}>
      {lotes
        .filter(l => l.cx != null && l.cy != null)
        .map(lote => {
          const { cx, cy } = lote
          const color      = ESTADO_COLOR[lote.estado] ?? '#0D2E40'
          const isSelected = selectedId === lote.id
          const dimmed     = isFiltered && !matches(lote)
          const rad        = isSelected ? r * 1.35 : r

          return (
            <g
              key={lote.id}
              onClick={() => onSelect(isSelected ? null : lote)}
              style={{
                cursor: 'pointer',
                opacity: dimmed ? 0.18 : 1,
                transition: 'opacity 0.4s',
              }}
            >
              {/* ── Pulso respiración — solo cuando no está seleccionado ni opacado ── */}
              {!dimmed && !isSelected && (
                <>
                  {/* Onda 1 */}
                  <circle cx={cx} cy={cy} r={rad} fill={color} fillOpacity="0">
                    <animate attributeName="r"
                      values={`${rad * 1.1};${rad * 3.2};${rad * 1.1}`}
                      dur="2.8s" repeatCount="indefinite" begin="0s" />
                    <animate attributeName="fill-opacity"
                      values="0.38;0;0.38"
                      dur="2.8s" repeatCount="indefinite" begin="0s" />
                  </circle>
                  {/* Onda 2 (desfasada) */}
                  <circle cx={cx} cy={cy} r={rad} fill={color} fillOpacity="0">
                    <animate attributeName="r"
                      values={`${rad * 1.1};${rad * 3.2};${rad * 1.1}`}
                      dur="2.8s" repeatCount="indefinite" begin="1.1s" />
                    <animate attributeName="fill-opacity"
                      values="0.28;0;0.28"
                      dur="2.8s" repeatCount="indefinite" begin="1.1s" />
                  </circle>
                </>
              )}

              {/* ── Halo seleccionado ── */}
              {isSelected && (
                <circle
                  cx={cx} cy={cy} r={rad * 2.6}
                  fill={color} fillOpacity="0.18"
                  stroke={color} strokeWidth={rad * 0.09} strokeOpacity="0.5"
                  style={{ transition: 'all 0.25s' }}
                />
              )}

              {/* ── Dot principal ── */}
              <circle
                cx={cx} cy={cy} r={rad}
                fill={isSelected ? '#fff' : color}
                stroke={isSelected ? color : 'rgba(0,0,0,0.35)'}
                strokeWidth={rad * 0.14}
                style={{ transition: 'all 0.25s' }}
              />

              {/* ── Número del lote ── */}
              <text
                x={cx} y={cy}
                textAnchor="middle" dominantBaseline="central"
                fill={isSelected ? '#0D2E40' : 'rgba(255,255,255,0.95)'}
                fontSize={rad * 0.9}
                fontWeight="800"
                fontFamily="Inter, system-ui, sans-serif"
                letterSpacing="-0.02em"
                style={{ pointerEvents: 'none', userSelect: 'none', transition: 'all 0.25s' }}
              >
                {lote.id.replace(/[^0-9]/g, '')}
              </text>
            </g>
          )
        })}
    </g>
  )
}
