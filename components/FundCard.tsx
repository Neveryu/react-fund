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
  const referenceDate = data.valuationTime?.slice(0, 10) || data.topHoldingsDate
  const hasCurrentOfficialNav = Boolean(referenceDate && data.navDate >= referenceDate)
  const hasValuation = !hasCurrentOfficialNav && data.dayChange !== null && typeof data.estimatedNav === 'number'
  const hasTopHoldingsChange = !hasCurrentOfficialNav && typeof data.topHoldingsChange === 'number'
  const displayedChange = hasValuation
    ? data.dayChange
    : hasTopHoldingsChange
      ? data.topHoldingsChange ?? null
      : data.officialDayChange ?? null
  const displayedNav = hasValuation ? data.estimatedNav ?? data.nav : data.nav
  const isPositive = (displayedChange ?? 0) >= 0
  const periodReturn = period === 'oneDay'
    ? displayedChange
    : (data.returns?.[period as keyof typeof data.returns] ?? 0)
  const isPeriodPositive = (periodReturn ?? 0) >= 0

  return (
    <div
      className={cn(
        'group relative flex min-w-0 flex-col items-start justify-between gap-3 overflow-hidden rounded-lg border border-border/50 px-3 py-3 hover:bg-secondary/30 transition-colors sm:flex-row sm:items-center sm:gap-2 sm:pl-4 sm:pr-10',
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

      <div className="flex min-w-0 w-full flex-1 items-center gap-3 sm:w-auto">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex min-w-0 items-center gap-2">
            <h3 
              onClick={onClick}
              className="min-w-0 truncate text-sm font-medium cursor-pointer hover:text-primary transition-colors"
            >
              {data.name}
            </h3>
            <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {data.type}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{data.code}</span>
            {data.manager && <span className="hidden sm:inline">{data.manager}</span>}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-5">
        <div className="flex min-w-0 items-center justify-between text-right sm:block sm:min-w-[70px]">
          <p className="text-base font-bold tabular-nums">{displayedNav.toFixed(4)}</p>
          {hasValuation ? (
            <p className={cn('flex items-center justify-end gap-0.5 text-xs font-medium tabular-nums', isPositive ? 'text-success' : 'text-destructive')}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? '+' : ''}{displayedChange?.toFixed(2)}%
            </p>
          ) : hasTopHoldingsChange ? (
            <p
              className={cn('max-w-[68%] truncate text-xs font-medium tabular-nums', isPositive ? 'text-success' : 'text-destructive')}
              title={`基于${data.holdingsReportDate || '最新披露期'}前十大持仓，覆盖${data.topHoldingsCoverage?.toFixed(2) || '--'}%基金净值`}
            >
              重仓表现 {isPositive ? '+' : ''}{displayedChange?.toFixed(2)}%
            </p>
          ) : (
            <p className="max-w-[68%] truncate text-xs text-muted-foreground" title={`正式净值 ${data.navDate || '暂无日期'}`}>
              正式净值 {data.navDate || '暂无日期'}
            </p>
          )}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-0.5 sm:flex-nowrap">
          {(Object.keys(periodLabels) as Period[]).map((key) => {
            const val = key === 'oneDay'
              ? displayedChange
              : (data.returns?.[key as keyof typeof data.returns] ?? 0)
            const pos = (val ?? 0) >= 0
            return (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={cn(
                  'shrink-0 rounded px-1.5 py-0.5 text-xs tabular-nums transition-colors',
                  period === key
                    ? val === null
                      ? 'bg-secondary text-muted-foreground font-medium'
                      : pos
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
              'ml-1 shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums',
              periodReturn === null
                ? 'bg-secondary text-muted-foreground'
                : isPeriodPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}
          >
            {periodReturn === null ? '暂无' : `${isPeriodPositive ? '+' : ''}${periodReturn.toFixed(2)}%`}
          </span>
        </div>
      </div>
    </div>
  )
}
