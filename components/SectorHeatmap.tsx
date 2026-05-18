'use client'

import { cn } from '@/lib/utils'
import type { SectorData } from '@/lib/data'

interface SectorHeatmapProps {
  sectors: SectorData[]
}

function getBgColor(value: number, maxAbs: number): string {
  if (value === 0) return 'bg-gray-100'
  const ratio = value / maxAbs
  if (ratio > 0) {
    if (ratio > 0.7) return 'bg-red-200'
    if (ratio > 0.4) return 'bg-red-100'
    return 'bg-red-50'
  }
  if (ratio < -0.7) return 'bg-green-200'
  if (ratio < -0.4) return 'bg-green-100'
  return 'bg-green-50'
}

function getTextColor(value: number): string {
  if (value === 0) return 'text-gray-500'
  if (value > 0.5) return 'text-red-600'
  if (value > 0) return 'text-red-500'
  if (value < -0.5) return 'text-green-600'
  return 'text-green-500'
}

function getNameSize(value: number): string {
  const abs = Math.abs(value)
  if (abs > 3) return 'text-sm'
  if (abs > 1.5) return 'text-xs'
  return 'text-[10px]'
}

export default function SectorHeatmap({ sectors }: SectorHeatmapProps) {
  if (!sectors.length) return null

  const maxAbs = Math.max(...sectors.map((s) => Math.abs(s.changePercent)), 0.1)

  const sorted = [...sectors].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 overflow-hidden">
      {/* 比例尺 - 右上角 */}
      <div className="flex items-center justify-end gap-1 px-4 py-2 border-b border-border/50">
        {[-3, -2, -1, 0, 1, 2, 3].map((v) => {
          const colorClass =
            v === 0
              ? 'bg-gray-100'
              : v > 0
                ? v >= 2
                  ? 'bg-red-200'
                  : 'bg-red-100'
                : v <= -2
                  ? 'bg-green-200'
                  : 'bg-green-100'
          return (
            <span key={v} className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={cn('inline-block w-4 h-4 rounded', colorClass)} />
              <span>{v}%</span>
            </span>
          )
        })}
      </div>

      {/* Treemap */}
      <div className="p-2">
        <div className="flex flex-wrap gap-1">
          {sorted.map((sector) => {
            const absPct = Math.abs(sector.changePercent)
            const sizeFactor = Math.max(absPct / maxAbs, 0.15)
            const widthClass =
              sizeFactor > 0.6
                ? 'w-full sm:w-1/2 lg:w-1/3'
                : sizeFactor > 0.4
                  ? 'w-1/2 sm:w-1/3 lg:w-1/4'
                  : sizeFactor > 0.25
                    ? 'w-1/3 sm:w-1/4 lg:w-[15%]'
                    : 'w-1/4 sm:w-1/5 lg:w-[10%]'

            const heightFactor = Math.max(sizeFactor * 1.6, 0.3)
            const heightPx = Math.max(Math.min(heightFactor * 100, 120), 50)

            return (
              <div
                key={sector.code}
                className={cn(
                  'flex flex-col items-center justify-center rounded-md border border-border/20 transition-transform hover:scale-[1.02] cursor-default',
                  widthClass,
                  getBgColor(sector.changePercent, maxAbs)
                )}
                style={{ height: `${heightPx}px`, minHeight: '50px' }}
              >
                <span className={cn('font-medium truncate max-w-full px-1', getNameSize(sector.changePercent), getTextColor(sector.changePercent))}>
                  {sector.name}
                </span>
                <span className={cn('mt-0.5', getTextColor(sector.changePercent))}>
                  {sector.changePercent >= 0 ? '+' : ''}
                  {sector.changePercent.toFixed(2)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
