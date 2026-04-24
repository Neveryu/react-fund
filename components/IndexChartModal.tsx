'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import type { IndexData } from '@/lib/data'
import { fetchKline, INDEX_META } from '@/lib/client-api'

interface KlineItem {
  date: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  change: number
  changePercent: number
}

type KltType = 'day' | 'week' | 'month'

const KLT_OPTIONS: { label: string; value: KltType }[] = [
  { label: '日K', value: 'day' },
  { label: '周K', value: 'week' },
  { label: '月K', value: 'month' },
]

export default function IndexChartModal({
  index,
  onClose,
}: {
  index: IndexData | null
  onClose: () => void
}) {
  const [klines, setKlines] = useState<KlineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [klt, setKlt] = useState<KltType>('day')

  const fetchKlineData = useCallback(async () => {
    if (!index) return
    setLoading(true)
    try {
      const meta = INDEX_META[index.code]
      const secid = meta?.secid || index.code
      const result = await fetchKline(secid, klt, 120)
      if (result?.klines) {
        setKlines(result.klines)
      } else {
        setKlines([])
      }
    } catch {
      setKlines([])
    } finally {
      setLoading(false)
    }
  }, [index, klt])

  useEffect(() => {
    fetchKlineData()
  }, [fetchKlineData])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!index) return null

  const isPositive = index.changePercent >= 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xl">{index.flag}</span>
            <div>
              <h3 className="text-sm font-bold">{index.name}</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold tabular-nums">
                  {index.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className={isPositive ? 'text-success' : 'text-destructive'}>
                  {isPositive ? '+' : ''}{index.change.toFixed(2)}
                </span>
                <span
                  className={
                    isPositive
                      ? 'text-success bg-success/10 px-1.5 py-0.5 rounded text-[10px] font-semibold'
                      : 'text-destructive bg-destructive/10 px-1.5 py-0.5 rounded text-[10px] font-semibold'
                  }
                >
                  {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* KLT Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border/50">
          {KLT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setKlt(opt.value)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                klt === opt.value
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                加载中...
              </div>
            </div>
          ) : klines.length > 0 ? (
            <KlineChart klines={klines} />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-sm text-muted-foreground">
              暂无K线数据
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KlineChart({ klines }: { klines: KlineItem[] }) {
  const chartWidth = 700
  const chartHeight = 300
  const volumeHeight = 80
  const totalHeight = chartHeight + volumeHeight + 30
  const paddingRight = 60
  const paddingLeft = 10
  const paddingBottom = 20
  const drawWidth = chartWidth - paddingLeft - paddingRight
  const drawHeight = chartHeight - paddingBottom

  const prices = klines.flatMap((k) => [k.high, k.low])
  const volumes = klines.map((k) => k.volume)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const priceRange = maxPrice - minPrice || 1
  const maxVolume = Math.max(...volumes) || 1

  const barWidth = Math.max(1, (drawWidth / klines.length) * 0.7)
  const barGap = drawWidth / klines.length

  const priceY = (price: number) =>
    drawHeight - ((price - minPrice) / priceRange) * (drawHeight - 10) + 5

  const ma5 = calcMA(klines, 5)
  const ma10 = calcMA(klines, 10)
  const ma20 = calcMA(klines, 20)

  const dateLabels = klines
    .filter((_, i) => i % Math.ceil(klines.length / 6) === 0)
    .map((k, i) => {
      const x = paddingLeft + i * Math.ceil(klines.length / 6) * barGap + barGap / 2
      return (
        <text
          key={k.date}
          x={x}
          y={totalHeight - 2}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="9"
        >
          {k.date.slice(2)}
        </text>
      )
    })

  const priceLabels = [minPrice, minPrice + priceRange * 0.25, minPrice + priceRange * 0.5, minPrice + priceRange * 0.75, maxPrice]

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={chartWidth}
        height={totalHeight}
        viewBox={`0 0 ${chartWidth} ${totalHeight}`}
        className="min-w-[600px]"
      >
        {/* Price grid lines */}
        {priceLabels.map((p) => (
          <g key={p}>
            <line
              x1={paddingLeft}
              y1={priceY(p)}
              x2={chartWidth - paddingRight}
              y2={priceY(p)}
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              strokeDasharray="4,4"
            />
            <text
              x={chartWidth - paddingRight + 4}
              y={priceY(p) + 3}
              className="fill-muted-foreground"
              fontSize="9"
            >
              {p.toFixed(p > 1000 ? 0 : 2)}
            </text>
          </g>
        ))}

        {/* Candlesticks */}
        {klines.map((k, i) => {
          const x = paddingLeft + i * barGap + barGap / 2
          const isUp = k.close >= k.open
          const color = isUp ? 'hsl(var(--success))' : 'hsl(var(--destructive))'
          const bodyTop = priceY(Math.max(k.open, k.close))
          const bodyBottom = priceY(Math.min(k.open, k.close))
          const bodyHeight = Math.max(1, bodyBottom - bodyTop)

          return (
            <g key={k.date}>
              {/* Wick */}
              <line
                x1={x}
                y1={priceY(k.high)}
                x2={x}
                y2={priceY(k.low)}
                stroke={color}
                strokeWidth="1"
              />
              {/* Body */}
              <rect
                x={x - barWidth / 2}
                y={bodyTop}
                width={barWidth}
                height={bodyHeight}
                fill={isUp ? 'transparent' : color}
                stroke={color}
                strokeWidth="1"
              />
              {/* Volume */}
              <rect
                x={x - barWidth / 2}
                y={chartHeight + volumeHeight - (k.volume / maxVolume) * volumeHeight}
                width={barWidth}
                height={(k.volume / maxVolume) * volumeHeight}
                fill={color}
                opacity="0.3"
              />
            </g>
          )
        })}

        {/* MA lines */}
        {ma5.length > 1 && (
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1"
            points={ma5
              .map(
                (v, i) =>
                  `${paddingLeft + (klines.length - ma5.length + i) * barGap + barGap / 2},${priceY(v)}`
              )
              .join(' ')}
          />
        )}
        {ma10.length > 1 && (
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
            points={ma10
              .map(
                (v, i) =>
                  `${paddingLeft + (klines.length - ma10.length + i) * barGap + barGap / 2},${priceY(v)}`
              )
              .join(' ')}
          />
        )}
        {ma20.length > 1 && (
          <polyline
            fill="none"
            stroke="#a855f7"
            strokeWidth="1"
            points={ma20
              .map(
                (v, i) =>
                  `${paddingLeft + (klines.length - ma20.length + i) * barGap + barGap / 2},${priceY(v)}`
              )
              .join(' ')}
          />
        )}

        {/* Volume separator */}
        <line
          x1={paddingLeft}
          y1={chartHeight}
          x2={chartWidth - paddingRight}
          y2={chartHeight}
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
        />

        {/* Date labels */}
        {dateLabels}

        {/* MA Legend */}
        <g transform={`translate(${paddingLeft + 4}, 12)`}>
          <text x="0" y="0" fontSize="9" fill="#f59e0b">MA5</text>
          <text x="35" y="0" fontSize="9" fill="#3b82f6">MA10</text>
          <text x="75" y="0" fontSize="9" fill="#a855f7">MA20</text>
        </g>
      </svg>
    </div>
  )
}

function calcMA(klines: KlineItem[], period: number): number[] {
  const result: number[] = []
  for (let i = period - 1; i < klines.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += klines[j].close
    }
    result.push(sum / period)
  }
  return result
}
