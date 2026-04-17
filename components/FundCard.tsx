'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { FundData } from '@/lib/data'
import { X } from 'lucide-react'

const periodLabels = {
  oneWeek: '1周',
  oneMonth: '1月',
  threeMonth: '3月',
  sixMonth: '6月',
  oneYear: '1年',
} as const

type Period = keyof typeof periodLabels

export default function FundCard({ data, onRemove }: { data: FundData; onRemove?: () => void }) {
  const [period, setPeriod] = useState<Period>('oneMonth')
  const isPositive = data.dayChange >= 0
  const periodReturn = data.returns?.[period] ?? 0
  const isPeriodPositive = periodReturn >= 0

  return (
    <div
      className={cn(
        'group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 px-3 py-2 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors',
      )}
    >
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute top-1 right-1 z-10 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
          title="移除"
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
        </button>
      )}

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-medium truncate">{data.name}</h3>
            <span className="text-[9px] px-1 rounded bg-primary/10 text-primary font-medium shrink-0">
              {data.type}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">{data.code}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-xs font-bold tabular-nums">{data.nav.toFixed(4)}</p>
          <p className={cn('text-[10px] tabular-nums', isPositive ? 'text-success' : 'text-destructive')}>
            {isPositive ? '+' : ''}{data.dayChange.toFixed(2)}%
          </p>
        </div>

        {data.returns && (
          <div className="flex items-center gap-0.5">
            {(Object.keys(periodLabels) as Period[]).map((key) => {
              const val = data.returns?.[key] ?? 0
              const pos = val >= 0
              return (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={cn(
                    'text-[9px] px-1 py-0.5 rounded transition-colors tabular-nums',
                    period === key
                      ? pos
                        ? 'bg-success/15 text-success font-medium'
                        : 'bg-destructive/15 text-destructive font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {periodLabels[key]}
                </button>
              )
            })}
            <span
              className={cn(
                'text-[10px] font-semibold tabular-nums ml-1 px-1 py-0.5 rounded',
                isPeriodPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              )}
            >
              {isPeriodPositive ? '+' : ''}
              {periodReturn.toFixed(2)}%
            </span>
          </div>
        )}

        {data.sparkline && data.sparkline.length >= 2 && (
          <div className="w-14 h-5 opacity-60 hidden sm:block">
            <svg width={56} height={20} viewBox="0 0 56 20" className="overflow-visible">
              {(() => {
                const d = data.sparkline!
                const min = Math.min(...d)
                const max = Math.max(...d)
                const range = max - min || 1
                const pts = d.map((v, i) => ({
                  x: (i / (d.length - 1)) * 56,
                  y: 18 - ((v - min) / range) * 16,
                }))
                const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
                return (
                  <path
                    d={line}
                    fill="none"
                    stroke={isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )
              })()}
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
