'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { IndexData } from '@/lib/data'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function MarketTicker({ indices }: { indices: IndexData[] }) {
  const [isPaused, setIsPaused] = useState(false)
  const items = [...indices, ...indices]

  return (
    <div
      className="border-y border-border/50 bg-secondary/30 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="flex gap-8 py-2.5 px-4 animate-ticker"
        style={{ width: 'max-content', animationPlayState: isPaused ? 'paused' : 'running' }}
      >
        {items.map((item, i) => {
          const isPositive = item.changePercent >= 0
          return (
            <div key={`${item.code}-${i}`} className="flex items-center gap-2 shrink-0">
              <span className="text-xs">{item.flag}</span>
              <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
              <span className="text-xs font-semibold tabular-nums">
                {item.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={cn(
                  'text-xs font-medium tabular-nums inline-flex items-center',
                  isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {isPositive ? '+' : ''}
                {item.changePercent.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
