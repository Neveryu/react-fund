'use client'

import { useMemo, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import type { HeatmapSector, HeatmapStock } from '@/lib/data'

interface SectorHeatmapProps {
  data: HeatmapSector[]
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

function layoutRow(items: { value: number }[], x: number, y: number, w: number, h: number): Rect[] {
  if (items.length === 0) return []
  const total = items.reduce((s, i) => s + i.value, 0)
  if (total === 0) return items.map(() => ({ x, y, w: 0, h: 0 }))

  const isWide = w >= h
  const rects: Rect[] = []
  let offset = 0

  for (const item of items) {
    const fraction = item.value / total
    if (isWide) {
      const size = h * fraction
      rects.push({ x, y: y + offset, w, h: size })
      offset += size
    } else {
      const size = w * fraction
      rects.push({ x: x + offset, y, w: size, h })
      offset += size
    }
  }

  return rects
}

function treemap(items: { value: number }[], x: number, y: number, w: number, h: number): Rect[] {
  if (items.length === 0) return []
  if (items.length === 1) return [{ x, y, w, h }]

  const total = items.reduce((s, i) => s + i.value, 0)
  if (total === 0) return items.map(() => ({ x, y, w: 0, h: 0 }))

  const isWide = w >= h

  let row: { value: number }[] = []
  let rowValue = 0
  let bestAspect = Infinity
  const results: Rect[] = []
  let cx = x, cy = y, cw = w, ch = h
  let remaining = [...items]

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const testRow = [...row, item]
    const testValue = rowValue + item.value
    const fraction = testValue / total
    const side = isWide ? cw * fraction : ch * fraction
    const otherSide = isWide ? ch : cw

    let worst = 0
    for (const r of testRow) {
      const rFrac = r.value / testValue
      const a = otherSide * rFrac
      const ratio = Math.max(side / a, a / side)
      worst = Math.max(worst, ratio)
    }

    if (row.length > 0 && worst > bestAspect) {
      const rowFraction = rowValue / total
      const cutSize = isWide ? cw * rowFraction : ch * rowFraction

      const rowRects = layoutRow(row, cx, cy, isWide ? cutSize : cw, isWide ? ch : cutSize)
      results.push(...rowRects)

      if (isWide) {
        cx += cutSize
        cw -= cutSize
      } else {
        cy += cutSize
        ch -= cutSize
      }

      remaining = remaining.slice(row.length)
      if (remaining.length > 0 && cw > 0.01 && ch > 0.01) {
        results.push(...treemap(remaining, cx, cy, cw, ch))
      }
      return results
    }

    bestAspect = worst
    row.push(item)
    rowValue = testValue
  }

  const rowFraction = rowValue / total
  const cutSize = isWide ? cw * rowFraction : ch * rowFraction
  const rowRects = layoutRow(row, cx, cy, isWide ? cutSize : cw, isWide ? ch : cutSize)
  results.push(...rowRects)

  return results
}

function getColor(value: number): { bg: string; text: string } {
  if (value >= 5) return { bg: 'bg-red-600', text: 'text-white' }
  if (value >= 3) return { bg: 'bg-red-500', text: 'text-white' }
  if (value >= 1.5) return { bg: 'bg-red-400', text: 'text-white' }
  if (value >= 0.5) return { bg: 'bg-red-300', text: 'text-red-900' }
  if (value > 0) return { bg: 'bg-red-200', text: 'text-red-800' }
  if (value === 0) return { bg: 'bg-gray-200', text: 'text-gray-600' }
  if (value > -0.5) return { bg: 'bg-green-200', text: 'text-green-800' }
  if (value > -1.5) return { bg: 'bg-green-300', text: 'text-green-900' }
  if (value > -3) return { bg: 'bg-green-400', text: 'text-white' }
  if (value > -5) return { bg: 'bg-green-500', text: 'text-white' }
  return { bg: 'bg-green-600', text: 'text-white' }
}

function formatMarketCap(v: number): string {
  if (v >= 1e12) return (v / 1e12).toFixed(1) + '万亿'
  if (v >= 1e8) return (v / 1e8).toFixed(0) + '亿'
  return (v / 1e4).toFixed(0) + '万'
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

export default function SectorHeatmap({ data }: SectorHeatmapProps) {
  const isMobile = useIsMobile()

  const layout = useMemo(() => {
    if (!data.length) return []

    const maxSectors = isMobile ? 10 : 25
    const maxStocks = isMobile ? 5 : 20

    const filteredData = data.slice(0, maxSectors).map((s) => ({
      ...s,
      stocks: s.stocks.slice(0, maxStocks),
    }))

    const sectorItems = filteredData.map((s) => ({ sector: s, value: s.marketCap }))
    const sectorRects = treemap(sectorItems, 0, 0, 100, 100)

    const result: {
      sector: HeatmapSector
      rect: Rect
      stocks: { stock: HeatmapStock; rect: Rect }[]
    }[] = []

    for (let i = 0; i < sectorItems.length; i++) {
      const sr = sectorRects[i]
      if (!sr || sr.w < 0.01 || sr.h < 0.01) continue

      const sector = sectorItems[i].sector
      const stockItems = sector.stocks.map((st) => ({ stock: st, value: st.marketCap }))
      const stockRects = treemap(stockItems, sr.x, sr.y, sr.w, sr.h)

      const stocks = stockItems.map((si, j) => ({
        stock: si.stock,
        rect: stockRects[j] || { x: sr.x, y: sr.y, w: 0, h: 0 },
      }))

      result.push({ sector, rect: sr, stocks })
    }

    return result
  }, [data, isMobile])

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">暂无板块热力图数据</p>
      </div>
    )
  }

  const nameThreshold = isMobile ? 2.5 : 0.8
  const percentThreshold = isMobile ? 1.5 : 0.5
  const sectorLabelThreshold = isMobile ? 5 : 2

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 overflow-hidden">
      {/* 比例尺 */}
      <div className="flex items-center justify-end gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 border-b border-border/50 overflow-x-auto">
        {[-5, -3, -1, 0, 1, 3, 5].map((v) => {
          const { bg } = getColor(v)
          return (
            <span key={v} className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-muted-foreground shrink-0">
              <span className={cn('inline-block w-3 h-3 sm:w-4 sm:h-4 rounded', bg)} />
              <span>{v}%</span>
            </span>
          )
        })}
      </div>

      {/* Treemap */}
      <div className="p-1.5 sm:p-2">
        <div className="relative w-full" style={{ paddingBottom: isMobile ? '120%' : '65%' }}>
          {layout.map((group) => {
            const sectorArea = group.rect.w * group.rect.h
            const showSectorLabel = sectorArea > sectorLabelThreshold

            return (
              <div key={group.sector.code}>
                {group.stocks.map((item) => {
                  const { bg, text } = getColor(item.stock.changePercent)
                  const area = item.rect.w * item.rect.h
                  const showName = area > nameThreshold
                  const showPercent = area > percentThreshold
                  const fontSize = isMobile
                    ? area > 10 ? 'text-xs' : area > 4 ? 'text-[10px]' : 'text-[8px]'
                    : area > 6 ? 'text-sm' : area > 2 ? 'text-xs' : 'text-[10px]'
                  const percentSize = isMobile
                    ? area > 10 ? 'text-[10px]' : area > 4 ? 'text-[9px]' : 'text-[8px]'
                    : area > 6 ? 'text-xs' : area > 2 ? 'text-[10px]' : 'text-[9px]'

                  return (
                    <div
                      key={item.stock.code}
                      className={cn(
                        'absolute flex flex-col items-center justify-center overflow-hidden cursor-default',
                        bg,
                        text
                      )}
                      style={{
                        left: `${item.rect.x}%`,
                        top: `${item.rect.y}%`,
                        width: `${item.rect.w}%`,
                        height: `${item.rect.h}%`,
                      }}
                      title={`${item.stock.name} ${item.stock.changePercent >= 0 ? '+' : ''}${item.stock.changePercent.toFixed(2)}% 市值${formatMarketCap(item.stock.marketCap)}`}
                    >
                      {showName && (
                        <span className={cn('font-medium truncate max-w-full px-0.5 leading-tight', fontSize)}>
                          {item.stock.name}
                        </span>
                      )}
                      {showPercent && (
                        <span className={cn('leading-tight', percentSize)}>
                          {item.stock.changePercent >= 0 ? '+' : ''}{item.stock.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  )
                })}

                {showSectorLabel && (
                  <div
                    className="absolute pointer-events-none z-10"
                    style={{
                      left: `${group.rect.x}%`,
                      top: `${group.rect.y}%`,
                      width: `${group.rect.w}%`,
                    }}
                  >
                    <span className={cn(
                      'font-bold text-white/90 bg-black/30 px-1 sm:px-1.5 py-0.5 rounded-br inline-block backdrop-blur-[1px]',
                      isMobile ? 'text-[9px]' : 'text-[10px]'
                    )}>
                      {group.sector.name}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}