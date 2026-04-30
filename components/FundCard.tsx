'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { FundData } from '@/lib/data'
import { X, TrendingUp, TrendingDown } from 'lucide-react'

const periodLabels = {
  oneDay: '日',
  oneWeek: '周',
  oneMonth: '月',
  threeMonth: '3月',
  sixMonth: '6月',
  oneYear: '年',
} as const

type Period = keyof typeof periodLabels

export default function FundCard({ data, onRemove, onClick }: { data: FundData; onRemove?: () => void; onClick?: () => void }) {
  const [period, setPeriod] = useState<Period>('oneDay')
  const isPositive = data.dayChange >= 0
  const periodReturn = period === 'oneDay'
    ? data.dayChange
    : (data.returns?.[period as keyof typeof data.returns] ?? 0)
  const isPeriodPositive = periodReturn >= 0

  return (
    <div
      className={cn(
        'group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pl-4 pr-8 sm:pr-10 py-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors',
      )}
    >
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="absolute top-1 right-1 z-10 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
          title="移除"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      )}

      <div className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 
              onClick={onClick}
              className="text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors"
            >
              {data.name}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">
              {data.type}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{data.code}</span>
            {data.manager && <span className="hidden sm:inline">{data.manager}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5 shrink-0 w-full sm:w-auto">
        <div className="text-right sm:min-w-[70px]">
          <p className="text-base font-bold tabular-nums">{data.nav.toFixed(4)}</p>
          <p className={cn('flex items-center justify-end gap-0.5 text-xs font-medium tabular-nums', isPositive ? 'text-success' : 'text-destructive')}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{data.dayChange.toFixed(2)}%
          </p>
        </div>

        <div className="flex items-center gap-0.5">
          {(Object.keys(periodLabels) as Period[]).map((key) => {
            const val = key === 'oneDay'
              ? data.dayChange
              : (data.returns?.[key as keyof typeof data.returns] ?? 0)
            const pos = val >= 0
            return (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded transition-colors tabular-nums',
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
              'text-xs font-semibold tabular-nums ml-1 px-1.5 py-0.5 rounded',
              isPeriodPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}
          >
            {isPeriodPositive ? '+' : ''}
            {periodReturn.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  )
}
