'use client'

import { useEffect, useState } from 'react'

/**
 * 访问统计（纯静态部署，无后端）
 * - 计数存储：VisitorBadge 免费计数 API（每个 path 一个独立计数器）
 * - 今日访问人数：按日期分桶的计数器，每台设备每天上报一次（UV 近似）
 * - 总访问人数：每台设备每天上报一次的累计计数器（访问人天累计，展示每日可刷新）
 * - 上报响应即包含最新数值，无需额外读取（读取接口会产生重复计数）
 */

const API = 'https://api.visitorbadge.io/api/visitors'
const DAILY_FLAG_KEY = 'fund-visit-daily-date'
const DAILY_COUNT_KEY = 'fund-visit-daily-count'
const TOTAL_FLAG_KEY = 'fund-visit-total-date'
const TOTAL_COUNT_KEY = 'fund-visit-total-count'

function counterNamespace(): string {
  // 避免本地开发流量污染线上计数
  return typeof window !== 'undefined' && window.location.hostname === 'neveryu.github.io'
    ? 'https://neveryu.github.io/react-fund'
    : 'https://react-fund.local-dev'
}

async function reportVisit(path: string): Promise<number | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(`${API}?path=${encodeURIComponent(path)}&init=true`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)
    if (!response.ok) return null
    const svg = await response.text()
    const match = svg.match(/VISITORS:\s*([\d,]+)/)
    if (!match) return null
    const count = parseInt(match[1].replace(/,/g, ''), 10)
    return Number.isFinite(count) ? count : null
  } catch {
    return null
  }
}

export default function VisitStats() {
  const [daily, setDaily] = useState<number | null>(null)
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const ns = counterNamespace()
    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD（本地时区）

    if (localStorage.getItem(DAILY_FLAG_KEY) !== today) {
      void reportVisit(`${ns}/daily-${today}`).then((count) => {
        if (count === null || cancelled) return
        localStorage.setItem(DAILY_FLAG_KEY, today)
        localStorage.setItem(DAILY_COUNT_KEY, String(count))
        setDaily(count)
      })
    } else {
      const cached = Number(localStorage.getItem(DAILY_COUNT_KEY))
      if (cached > 0) setDaily(cached)
    }

    if (localStorage.getItem(TOTAL_FLAG_KEY) !== today) {
      void reportVisit(ns).then((count) => {
        if (count === null || cancelled) return
        localStorage.setItem(TOTAL_FLAG_KEY, today)
        localStorage.setItem(TOTAL_COUNT_KEY, String(count))
        setTotal(count)
      })
    } else {
      const cached = Number(localStorage.getItem(TOTAL_COUNT_KEY))
      if (cached > 0) setTotal(cached)
    }

    return () => {
      cancelled = true
    }
  }, [])

  const format = (value: number | null) => (value === null ? '--' : value.toLocaleString())

  return (
    <p className="text-xs text-muted-foreground">
      今日访问 <span className="font-medium tabular-nums text-foreground/70">{format(daily)}</span> 人
      <span className="mx-1.5 opacity-50">·</span>
      累计访问 <span className="font-medium tabular-nums text-foreground/70">{format(total)}</span> 人
    </p>
  )
}
