'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import MiniChart from '@/components/MiniChart'
import { cn } from '@/lib/utils'
import type { FundData } from '@/lib/data'
import { ArrowUpRight, ArrowDownRight, User } from 'lucide-react'

const periodLabels = {
  oneWeek: '近1周',
  oneMonth: '近1月',
  threeMonth: '近3月',
  sixMonth: '近6月',
  oneYear: '近1年',
} as const

type Period = keyof typeof periodLabels

export default function FundCard({ data }: { data: FundData }) {
  const [period, setPeriod] = useState<Period>('oneMonth')
  const isPositive = data.dayChange >= 0
  const periodReturn = data.returns?.[period] ?? 0
  const isPeriodPositive = periodReturn >= 0

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-card">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="text-sm font-medium truncate">{data.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-muted-foreground">{data.code}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {data.type}
              </span>
            </div>
          </div>
          {data.sparkline && data.sparkline.length >= 2 && (
            <MiniChart
              data={data.sparkline}
              positive={isPositive}
              id={`fund-${data.code}`}
              width={80}
              height={32}
            />
          )}
        </div>

        {/* NAV */}
        <div className="flex items-baseline gap-6 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">最新净值</p>
            <p className="text-xl font-bold tabular-nums">{data.nav.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">日涨幅</p>
            <p
              className={cn(
                'text-sm font-semibold tabular-nums flex items-center gap-0.5',
                isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {isPositive ? '+' : ''}
              {data.dayChange.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Period Returns */}
        {data.returns ? (
          <div className="space-y-3">
            <div className="flex gap-1">
              {(Object.keys(periodLabels) as Period[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={cn(
                    'text-[11px] px-2 py-1 rounded-md transition-colors',
                    period === key
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  {periodLabels[key]}
                </button>
              ))}
            </div>
            <div
              className={cn(
                'text-center py-2 rounded-md text-sm font-semibold tabular-nums',
                isPeriodPositive
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {isPeriodPositive ? '+' : ''}
              {periodReturn.toFixed(2)}%
            </div>
          </div>
        ) : (
          <div className="py-3 text-center text-xs text-muted-foreground rounded-md bg-secondary/30">
            暂无历史收益数据
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {data.manager}
          </span>
          <span>规模 {data.scale}</span>
        </div>
      </CardContent>
    </Card>
  )
}
