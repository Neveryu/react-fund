'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { SectorData } from '@/lib/data'

interface SectorHeatmapProps {
  sectors: SectorData[]
}

interface TreemapRect {
  x: number
  y: number
  w: number
  h: number
  sector: SectorData
  value: number
}

function squarify(items: { sector: SectorData; value: number }[], x: number, y: number, w: number, h: number): TreemapRect[] {
  if (items.length === 0) return []
  if (items.length === 1) {
    return [{ x, y, w, h, sector: items[0].sector, value: items[0].value }]
  }

  const totalValue = items.reduce((s, i) => s + i.value, 0)
  if (totalValue === 0) return []

  const isWide = w >= h
  const side = isWide ? w : h

  let row: typeof items = []
  let rowArea = 0
  const results: TreemapRect[] = []

  let remaining = [...items]
  let cx = x, cy = y, cw = w, ch = h

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const itemArea = (item.value / totalValue) * side * (isWide ? h : w)

    const testRow = [...row, item]
    const testArea = rowArea + itemArea
    const rowSide = testArea / side

    let worst = Infinity
    for (const r of testRow) {
      const a = (r.value / totalValue) * side * (isWide ? h : w)
      const ratio = Math.max(rowSide / (a / rowSide), (a / rowSide) / rowSide)
      worst = Math.min(worst, ratio)
    }

    if (row.length > 0 && worst > 2.5) {
      const rowTotal = row.reduce((s, r) => s + r.value, 0)
      const rowFraction = rowTotal / totalValue
      const cutSize = isWide ? cw * rowFraction : ch * rowFraction

      let offset = 0
      for (const r of row) {
        const rFraction = r.value / rowTotal
        const size = (isWide ? ch : cw) * rFraction
        if (isWide) {
          results.push({ x: cx, y: cy + offset, w: cutSize, h: size, sector: r.sector, value: r.value })
        } else {
          results.push({ x: cx + offset, y: cy, w: size, h: cutSize, sector: r.sector, value: r.value })
        }
        offset += size
      }

      if (isWide) {
        cx += cutSize
        cw -= cutSize
      } else {
        cy += cutSize
        ch -= cutSize
      }

      const rowValue = row.reduce((s, r) => s + r.value, 0)
      remaining = remaining.slice(row.length)
      const newTotal = remaining.reduce((s, r) => s + r.value, 0)
      if (remaining.length > 0 && newTotal > 0 && cw > 0 && ch > 0) {
        results.push(...squarify(remaining, cx, cy, cw, ch))
      }
      return results
    }

    row.push(item)
    rowArea = testArea
  }

  let offset = 0
  const rowTotal = row.reduce((s, r) => s + r.value, 0)
  for (const r of row) {
    const rFraction = rowTotal > 0 ? r.value / rowTotal : 1 / row.length
    const size = (isWide ? ch : cw) * rFraction
    if (isWide) {
      results.push({ x: cx, y: cy + offset, w: cw, h: size, sector: r.sector, value: r.value })
    } else {
      results.push({ x: cx + offset, y: cy, w: size, h: ch, sector: r.sector, value: r.value })
    }
    offset += size
  }

  return results
}

function getBlockColor(value: number, maxAbs: number): { bg: string; text: string } {
  if (value === 0) return { bg: 'bg-gray-200', text: 'text-gray-600' }
  const ratio = value / maxAbs
  if (value > 0) {
    if (ratio > 0.6) return { bg: 'bg-red-500', text: 'text-white' }
    if (ratio > 0.3) return { bg: 'bg-red-400', text: 'text-white' }
    if (ratio > 0.1) return { bg: 'bg-red-300', text: 'text-red-900' }
    return { bg: 'bg-red-200', text: 'text-red-800' }
  }
  if (ratio < -0.6) return { bg: 'bg-green-600', text: 'text-white' }
  if (ratio < -0.3) return { bg: 'bg-green-500', text: 'text-white' }
  if (ratio < -0.1) return { bg: 'bg-green-400', text: 'text-green-900' }
  return { bg: 'bg-green-300', text: 'text-green-800' }
}

export default function SectorHeatmap({ sectors }: SectorHeatmapProps) {
  const rects = useMemo(() => {
    if (!sectors.length) return []

    const filtered = sectors.filter((s) => Math.abs(s.changePercent) > 0.01)
    const sorted = [...filtered].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))

    const top = sorted.slice(0, 60)

    const items = top.map((s) => ({
      sector: s,
      value: Math.abs(s.changePercent),
    }))

    return squarify(items, 0, 0, 100, 100)
  }, [sectors])

  if (!sectors.length) return null

  const maxAbs = Math.max(...sectors.map((s) => Math.abs(s.changePercent)), 0.1)

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 overflow-hidden">
      {/* 比例尺 */}
      <div className="flex items-center justify-end gap-1.5 px-4 py-2 border-b border-border/50">
        {[-3, -2, -1, 0, 1, 2, 3].map((v) => {
          const { bg } = getBlockColor(v, 3)
          return (
            <span key={v} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn('inline-block w-4 h-4 rounded', bg)} />
              <span>{v}%</span>
            </span>
          )
        })}
      </div>

      {/* Treemap */}
      <div className="p-2">
        <div className="relative w-full" style={{ paddingBottom: '65%' }}>
          {rects.map((rect) => {
            const { bg, text } = getBlockColor(rect.sector.changePercent, maxAbs)
            const area = rect.w * rect.h
            const showName = area > 1.5
            const showPercent = area > 0.8
            const fontSize = area > 8 ? 'text-sm' : area > 3 ? 'text-xs' : 'text-[10px]'
            const percentSize = area > 8 ? 'text-xs' : area > 3 ? 'text-[10px]' : 'text-[9px]'

            return (
              <div
                key={rect.sector.code}
                className={cn(
                  'absolute flex flex-col items-center justify-center overflow-hidden transition-opacity hover:opacity-80 cursor-default border border-white/10',
                  bg,
                  text
                )}
                style={{
                  left: `${rect.x}%`,
                  top: `${rect.y}%`,
                  width: `${rect.w}%`,
                  height: `${rect.h}%`,
                }}
              >
                {showName && (
                  <span className={cn('font-medium truncate max-w-full px-1 leading-tight', fontSize)}>
                    {rect.sector.name}
                  </span>
                )}
                {showPercent && (
                  <span className={cn('leading-tight', percentSize)}>
                    {rect.sector.changePercent >= 0 ? '+' : ''}
                    {rect.sector.changePercent.toFixed(2)}%
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
