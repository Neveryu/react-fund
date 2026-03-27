interface MiniChartProps {
  data: number[]
  width?: number
  height?: number
  positive?: boolean
  id: string
}

export default function MiniChart({ data, width = 120, height = 40, positive = true, id }: MiniChartProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = height * 0.1

  const points = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - padding - ((value - min) / range) * (height - padding * 2),
  }))

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const strokeColor = positive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'
  const gradientId = `chart-${id.replace(/[^a-zA-Z0-9]/g, '-')}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
