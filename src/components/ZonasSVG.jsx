/**
 * ZonasSVG
 * Badges de zonas comunitarias.
 * El tooltip se renderiza como HTML en MasterplanView (por encima de todo).
 */
import { useState } from 'react'

export default function ZonasSVG({ zonas, imgW, imgH, onZoom, onSelect, onHover, onHoverEnd }) {
  const [hovered, setHovered] = useState(null)

  const r = imgW * 0.008

  return (
    <g style={{ pointerEvents: 'all' }}>
      {zonas.map((zona) => {
        const cx = zona.cx
        const cy = zona.cy
        const isHov = hovered === zona.id
        const rad = isHov ? r * 1.25 : r
        const fontSize = r * 0.75

        return (
          <g
            key={zona.id}
            style={{ cursor: 'pointer' }}
            onMouseEnter={e => {
              setHovered(zona.id)
              onHover?.(zona, e.clientX, e.clientY)
            }}
            onMouseMove={e => onHover?.(zona, e.clientX, e.clientY)}
            onMouseLeave={() => {
              setHovered(null)
              onHoverEnd?.()
            }}
            onClick={() => onSelect ? onSelect(zona) : onZoom?.(zona.cx, zona.cy)}
          >
            {/* Halo */}
            <circle
              cx={cx} cy={cy} r={rad * 1.7}
              fill={zona.color} fillOpacity={isHov ? 0.15 : 0.08}
              style={{ transition: 'all 0.25s' }}
            />

            {/* Círculo principal */}
            <circle
              cx={cx} cy={cy} r={rad}
              fill={isHov ? zona.color : 'rgba(0,0,0,0.6)'}
              stroke={zona.color}
              strokeWidth={rad * 0.12}
              style={{ transition: 'all 0.25s' }}
            />

            {/* Código */}
            <text
              x={cx} y={cy}
              textAnchor="middle" dominantBaseline="central"
              fill={isHov ? '#050a06' : zona.color}
              fontSize={zona.codigo.length > 2 ? fontSize * 0.85 : fontSize}
              fontWeight="700"
              fontFamily="Inter, system-ui, sans-serif"
              letterSpacing="0.03em"
              style={{ pointerEvents: 'none', userSelect: 'none', transition: 'all 0.25s' }}
            >
              {zona.codigo}
            </text>
          </g>
        )
      })}
    </g>
  )
}
