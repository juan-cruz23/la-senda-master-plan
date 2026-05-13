import { useState } from 'react'
import { motion } from 'framer-motion'

const ESTADO_COLORS = {
  disponible: {
    fill: '#9A7D4A',
    fillHover: '#C4B49A',
    stroke: '#C4B49A',
    fillOpacity: 0.35,
    strokeOpacity: 0.8,
  },
  reservado: {
    fill: '#f59e0b',
    fillHover: '#fbbf24',
    stroke: '#fde68a',
    fillOpacity: 0.35,
    strokeOpacity: 0.8,
  },
  vendido: {
    fill: '#ef4444',
    fillHover: '#f87171',
    stroke: '#fca5a5',
    fillOpacity: 0.30,
    strokeOpacity: 0.6,
  },
}

export default function LotesSVG({ lotes, zonas, selectedId, onSelectLote, viewBox }) {
  const [hoveredId, setHoveredId] = useState(null)

  return (
    <svg
      viewBox={viewBox}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
    >
      <defs>
        <filter id="glow-moss">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-amber">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Zonas comunitarias */}
      {zonas.map((zona) => (
        <g key={zona.id}>
          <polygon
            points={zona.puntos}
            fill="#C4B49A"
            fillOpacity={0.08}
            stroke="#C4B49A"
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray="4 3"
            style={{ pointerEvents: 'none' }}
          />
          <text
            x={zona.cx}
            y={zona.cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#C4B49A"
            fillOpacity={0.5}
            fontSize={9}
            fontFamily="Inter, sans-serif"
            fontWeight={500}
            letterSpacing={0.5}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {zona.nombre.toUpperCase()}
          </text>
        </g>
      ))}

      {/* Lotes */}
      {lotes.map((lote) => {
        const cfg = ESTADO_COLORS[lote.estado] ?? ESTADO_COLORS.disponible
        const isHovered = hoveredId === lote.id
        const isSelected = selectedId === lote.id
        const active = isHovered || isSelected

        return (
          <g
            key={lote.id}
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
            onMouseEnter={() => setHoveredId(lote.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={(e) => {
              const rect = e.currentTarget.closest('svg').getBoundingClientRect()
              const svgEl = e.currentTarget.closest('svg')
              // Convert click to screen coords for card anchor
              const clientX = e.clientX
              const clientY = e.clientY
              onSelectLote(lote, { x: clientX, y: clientY })
            }}
          >
            <polygon
              points={lote.puntos}
              fill={active ? cfg.fillHover : cfg.fill}
              fillOpacity={active ? 0.55 : cfg.fillOpacity}
              stroke={cfg.stroke}
              strokeOpacity={active ? 1 : cfg.strokeOpacity}
              strokeWidth={active ? 1.5 : 1}
              filter={active ? 'url(#glow-moss)' : undefined}
              style={{ transition: 'fill-opacity 0.2s, stroke-opacity 0.2s' }}
            />

            {/* Etiqueta ID */}
            {(() => {
              const pts = lote.puntos.split(' ').map(p => p.split(',').map(Number))
              const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
              const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
              return (
                <text
                  x={cx}
                  y={cy - 5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fillOpacity={active ? 1 : 0.7}
                  fontSize={9}
                  fontWeight={600}
                  fontFamily="Inter, sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {lote.id}
                </text>
              )
            })()}
            {(() => {
              const pts = lote.puntos.split(' ').map(p => p.split(',').map(Number))
              const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length
              const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length
              return (
                <text
                  x={cx}
                  y={cy + 7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fillOpacity={active ? 0.9 : 0.5}
                  fontSize={7.5}
                  fontFamily="Inter, sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {lote.area} m²
                </text>
              )
            })()}
          </g>
        )
      })}
    </svg>
  )
}
