'use client'

import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MarketStatsData } from '@/lib/data'

function formatTurnover(value: number): string {
  if (value >= 1e12) return (value / 1e12).toFixed(2) + '万亿'
  if (value >= 1e8) return (value / 1e8).toFixed(0) + '亿'
  if (value >= 1e4) return (value / 1e4).toFixed(0) + '万'
  return String(value)
}

export default function MarketOverview({ data }: { data: MarketStatsData | null }) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">暂无大盘数据</p>
      </div>
    )
  }

  const total = data.advancers + data.decliners + data.unchanged
  const advanceRatio = total > 0 ? (data.advancers / total) * 100 : 0
  const unchangedRatio = total > 0 ? (data.unchanged / total) * 100 : 0
  const declineRatio = total > 0 ? (data.decliners / total) * 100 : 0

  const cards = [
    {
      label: '上涨',
      value: data.advancers,
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: '下跌',
      value: data.decliners,
      icon: <TrendingDown className="h-4 w-4" />,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
    {
      label: '平盘',
      value: data.unchanged,
      icon: <Minus className="h-4 w-4" />,
      color: 'text-muted-foreground',
      bg: 'bg-secondary',
    },
    {
      label: '涨停/跌停',
      value: null,
      renderValue: () => (
        <div className="flex items-center gap-1.5">
          <span className="text-success inline-flex items-center gap-0.5">
            <ArrowUpRight className="h-3 w-3" />
            {data.limitUp}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-destructive inline-flex items-center gap-0.5">
            <ArrowDownRight className="h-3 w-3" />
            {data.limitDown}
          </span>
        </div>
      ),
      icon: <BarChart2 className="h-4 w-4" />,
      color: 'text-foreground',
      bg: 'bg-secondary',
    },
    {
      label: '两市成交额',
      value: null,
      renderValue: () => (
        <span className="text-foreground">{formatTurnover(data.totalTurnover)}</span>
      ),
      icon: <BarChart2 className="h-4 w-4" />,
      color: 'text-foreground',
      bg: 'bg-primary/10',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border/50 p-3 transition-colors hover:bg-secondary/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', card.bg, card.color)}>
                {card.icon}
              </div>
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <div className="text-lg font-bold tabular-nums">
              {card.renderValue ? card.renderValue() : (
                <span className={card.color}>{card.value}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 涨跌比例条 */}
      <div className="space-y-1.5">
        <div className="flex h-2.5 rounded-full overflow-hidden">
          {advanceRatio > 0 && (
            <div className="bg-success transition-all" style={{ width: `${advanceRatio}%` }} />
          )}
          {unchangedRatio > 0 && (
            <div className="bg-muted-foreground/30 transition-all" style={{ width: `${unchangedRatio}%` }} />
          )}
          {declineRatio > 0 && (
            <div className="bg-destructive transition-all" style={{ width: `${declineRatio}%` }} />
          )}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>上涨 {advanceRatio.toFixed(1)}%</span>
          <span>下跌 {declineRatio.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
