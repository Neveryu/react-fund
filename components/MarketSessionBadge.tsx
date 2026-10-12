'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { getMarketSession, formatCountdown } from '@/lib/market-session'

/**
 * A 股交易时段状态徽章：实时显示 交易中/集合竞价/午间休市/已收盘/周末休市 + 倒计时。
 * 内部每秒刷新一次，独立于主数据刷新节奏。
 */
export default function MarketSessionBadge() {
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(0)

  useEffect(() => {
    setMounted(true)
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // 避免 SSR 与客户端时间不一导致 hydration 闪烁：挂载前先不渲染
  if (!mounted) {
    return <span className="inline-flex items-center rounded-full border border-border/60 px-2.5 py-1 text-xs" />
  }

  const session = getMarketSession(new Date(now))
  const remaining = session.nextAt - now

  const dotColor =
    session.live
      ? 'bg-success'
      : session.key === 'preopen' || session.key === 'lunch'
        ? 'bg-amber-500'
        : 'bg-muted-foreground/60'

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-xs"
      title="按周一至周五时段判断，不含法定节假日调休"
    >
      <span className={cn('h-2 w-2 rounded-full', dotColor, session.live && 'animate-pulse')} />
      <span className={cn('font-medium', session.live ? 'text-success' : 'text-foreground')}>
        {session.label}
      </span>
      <span className="text-muted-foreground tabular-nums">
        {session.nextLabel} {formatCountdown(remaining)}
      </span>
    </span>
  )
}
