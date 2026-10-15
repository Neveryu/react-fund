'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchTurnoverHistory } from '@/lib/client-api'
import { TURNOVER_HISTORY_INDICES, TURNOVER_HISTORY_TTL } from '@/lib/turnover-history'
import type { TurnoverHistoryData, TurnoverHistoryIndex, TurnoverHistoryPoint } from '@/lib/data'

const PERIODS = [20, 60, 120] as const
const INDEX_KEYS: TurnoverHistoryIndex[] = ['sh', 'sz', 'cyb']

function amount(value: number | null): string {
  if (value === null) return '--'
  return value >= 1e12 ? `${(value / 1e12).toFixed(2)} 万亿元` : `${(value / 1e8).toFixed(2)} 亿元`
}

function percent(value: number | null): string {
  return value === null ? '--' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

export default function TurnoverHistory() {
  const [index, setIndex] = useState<TurnoverHistoryIndex>('sh')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(20)
  const [snapshots, setSnapshots] = useState<Partial<Record<TurnoverHistoryIndex, TurnoverHistoryData>>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [now, setNow] = useState(0)
  const refreshRef = useRef<(force: boolean) => void>(() => {})
  const selectId = useId()

  useEffect(() => {
    let cancelled = false
    let inFlight = false
    const load = async (force = false) => {
      if (inFlight || cancelled) return
      inFlight = true
      setLoading(true)
      setError(false)
      try {
        const next = await fetchTurnoverHistory(index, force)
        if (!cancelled) setSnapshots((prev) => ({ ...prev, [index]: next }))
      } catch {
        // 保留该指数上一次成功快照，失败不刷新时间戳。
        if (!cancelled) setError(true)
      } finally {
        inFlight = false
        if (!cancelled) {
          setLoading(false)
          setNow(Date.now())
        }
      }
    }
    refreshRef.current = (force) => { void load(force) }
    void load()
    const refreshVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    const interval = window.setInterval(refreshVisible, TURNOVER_HISTORY_TTL)
    document.addEventListener('visibilitychange', refreshVisible)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshVisible)
    }
  }, [index])

  useEffect(() => {
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const snapshot = snapshots[index]
  const points = useMemo(() => snapshot?.points.slice(-period) ?? [], [snapshot, period])
  const totals = points.flatMap((point) => point.totalTurnover === null ? [] : [point.totalTurnover])
  const last = points[points.length - 1]
  const average = totals.length ? totals.reduce((sum, value) => sum + value, 0) / totals.length : null
  const peak = totals.length ? Math.max(...totals) : null
  const missing = points.length - totals.length
  const today = new Date(now + 8 * 3600_000).toISOString().slice(0, 10)
  const isStale = snapshot && now - snapshot.fetchedAt > 2 * TURNOVER_HISTORY_TTL

  return (
    <div className="space-y-4 p-3 sm:p-5" data-testid="turnover-history">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor={selectId} className="text-muted-foreground">蜡烛图指数</label>
          <select
            id={selectId}
            value={index}
            onChange={(e) => setIndex(e.target.value as TurnoverHistoryIndex)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {INDEX_KEYS.map((key) => <option key={key} value={key}>{TURNOVER_HISTORY_INDICES[key].name}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="历史成交时间范围" className="flex rounded-lg border border-border/60 p-0.5 text-xs">
            {PERIODS.map((days) => (
              <button
                key={days}
                type="button"
                aria-pressed={period === days}
                onClick={() => setPeriod(days)}
                className={cn('rounded-md px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  period === days ? 'bg-primary/15 font-medium text-primary' : 'text-muted-foreground hover:bg-secondary')}
              >近 {days} 日</button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => refreshRef.current(true)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-secondary disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="刷新历史成交"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            刷新历史
          </button>
        </div>
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        日 K 看价格，折线看成交额；时间范围按交易日计算。切换指数只改变蜡烛图，折线始终为沪深两市合计（不含北交所）。
      </p>

      {error && (
        <div role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          {snapshot?.points.length ? '本次刷新失败，当前保留上次成功数据。' : '历史成交数据加载失败，请检查网络后重试。'}
          <button type="button" onClick={() => refreshRef.current(true)} className="ml-2 underline">重试</button>
        </div>
      )}
      {!snapshot && loading && <div role="status" className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><RefreshCw className="h-4 w-4 animate-spin" />正在加载历史成交数据…</div>}
      {snapshot && !points.length && !loading && <div role="status" className="py-16 text-center text-sm text-muted-foreground">该指数暂无历史成交数据，可切换指数或点击刷新历史。</div>}

      {last && (
        <>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {[
              { label: `最新成交额 · ${last.date}`, value: amount(last.totalTurnover) },
              { label: `区间日均 · ${totals.length} 个有效交易日`, value: amount(average) },
              { label: '区间最高成交额', value: amount(peak) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/40 bg-secondary/20 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-base font-semibold tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
          {(missing > 0 || last.date === today) && (
            <p className="text-xs leading-5 text-amber-600 dark:text-amber-400">
              {missing > 0 && `${missing} 个交易日的两市成交额不完整，折线断开且不计入日均。`}
              {last.date === today && '含当日数据，可能尚未收盘；当日成交额与区间统计以收盘后更新为准。'}
            </p>
          )}
          <HistoryChart key={`${index}-${period}`} points={points} indexName={TURNOVER_HISTORY_INDICES[index].name} />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{points[0].date} — {last.date} · 实际 {points.length} 个交易日{points.length < period ? '（不足所选范围）' : ''}</span>
            <span className={cn(isStale && 'text-amber-600 dark:text-amber-400')}>
              获取于 {new Date(snapshot!.fetchedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}（北京时间）{isStale && ' · 可能延迟'}
            </span>
          </div>
        </>
      )}
      <p className="text-[11px] leading-5 text-muted-foreground">来源：东方财富指数日 K 数据。成交额采用上证指数与深证成指接口的市场成交额口径；每 5 分钟检查更新，页面隐藏时暂停自动请求。双轴独立缩放，曲线交叉不代表数值相等。</p>
    </div>
  )
}

function HistoryChart({ points, indexName }: { points: TurnoverHistoryPoint[]; indexName: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(760)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const detailId = useId()

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setWidth(Math.max(300, entry.contentRect.width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const chart = useMemo(() => {
    const height = 320
    const left = 54, right = 64, top = 28, bottom = 34
    const plotWidth = width - left - right
    const plotHeight = height - top - bottom
    const low = Math.min(...points.map((point) => point.low))
    const high = Math.max(...points.map((point) => point.high))
    const padding = Math.max((high - low) * 0.12, high * 0.002, 1)
    const minPrice = low - padding, maxPrice = high + padding
    const maxAmount = Math.max(1, ...points.map((point) => point.totalTurnover ?? 0)) * 1.12
    const step = plotWidth / points.length
    const x = (i: number) => left + step * (i + 0.5)
    const yPrice = (price: number) => top + (maxPrice - price) / (maxPrice - minPrice) * plotHeight
    const yAmount = (value: number) => top + (1 - value / maxAmount) * plotHeight
    let connected = false
    const path = points.map((point, i) => {
      if (point.totalTurnover === null) { connected = false; return '' }
      const command = connected ? 'L' : 'M'
      connected = true
      return `${command}${x(i)},${yAmount(point.totalTurnover)}`
    }).join(' ')
    const tickCount = width < 500 ? 3 : 5
    const dateTicks = [...new Set(Array.from({ length: tickCount }, (_, i) => Math.round(i * (points.length - 1) / (tickCount - 1))))]
    return { height, left, right, top, bottom, plotHeight, minPrice, maxPrice, maxAmount, step, x, yPrice, yAmount, path, dateTicks }
  }, [points, width])

  const selected = Math.min(activeIndex ?? points.length - 1, points.length - 1)
  const active = points[selected]
  const { height, left, right, top, bottom, plotHeight, x, yPrice, yAmount } = chart
  const selectPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (!rect.width) return
    const chartX = (e.clientX - rect.left) / rect.width * width
    setActiveIndex(Math.max(0, Math.min(points.length - 1, Math.floor((chartX - left) / chart.step))))
  }

  return (
    <div ref={containerRef} className="min-w-0 rounded-lg border border-border/50 bg-secondary/10 p-2 sm:p-3">
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{indexName} · 日 K（左轴／点）</span>
        <span className="text-destructive">■ 收≥开</span><span className="text-success">■ 收&lt;开</span>
        <span className="inline-flex items-center gap-1 text-primary"><span className="h-0.5 w-4 bg-primary" />两市成交额（右轴／亿元）</span>
      </div>
      <div id={detailId} data-testid="history-chart-detail" className="mb-2 rounded-md bg-background/70 px-3 py-2 text-xs tabular-nums">
        <div className="mb-2 flex flex-wrap gap-2 font-medium"><span>{active.date}</span><span>{indexName}</span><span className="font-normal text-muted-foreground">悬停／触摸选日期；聚焦图表后可用左右方向键</span></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
          <span>开盘 {active.open.toFixed(2)}</span><span>收盘 {active.close.toFixed(2)}</span>
          <span>最高 {active.high.toFixed(2)}</span><span>最低 {active.low.toFixed(2)}</span>
          <span>较昨收 {percent(active.indexChangePercent)}</span><span>沪市 {amount(active.shTurnover)}</span>
          <span>深市 {amount(active.szTurnover)}</span><span className="font-medium text-primary">两市 {amount(active.totalTurnover)}</span>
        </div>
        <p className="mt-2 text-muted-foreground">成交额较上个交易日全天：{percent(active.turnoverChangePercent)}{active.totalTurnover === null && ' · 数据不完整'}</p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="slider"
        tabIndex={0}
        aria-label="历史成交联动图表日期"
        aria-valuemin={1}
        aria-valuemax={points.length}
        aria-valuenow={selected + 1}
        aria-valuetext={`${active.date}，${indexName}收盘 ${active.close.toFixed(2)} 点，两市成交额 ${amount(active.totalTurnover)}`}
        aria-describedby={detailId}
        onPointerMove={selectPointer}
        onPointerDown={selectPointer}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setActiveIndex(null) }}
        onKeyDown={(e) => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            e.preventDefault()
            setActiveIndex(e.key === 'Home' ? 0 : e.key === 'End' ? points.length - 1 : Math.max(0, Math.min(points.length - 1, selected + (e.key === 'ArrowLeft' ? -1 : 1))))
          }
        }}
        className="touch-pan-y rounded-md text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <title>{indexName}日 K 与沪深两市成交额</title>
        <text x={left} y={15} fill="currentColor" fontSize={11}>指数／点</text>
        <text x={width - right} y={15} textAnchor="end" fill="hsl(var(--primary))" fontSize={11}>成交额／亿元</text>
        {Array.from({ length: 5 }, (_, i) => {
          const y = top + plotHeight * i / 4
          return <g key={i}>
            <line x1={left} x2={width - right} y1={y} y2={y} stroke="hsl(var(--border))" strokeDasharray="3 4" />
            <text x={left - 7} y={y + 4} textAnchor="end" fill="currentColor" fontSize={10}>{(chart.maxPrice - (chart.maxPrice - chart.minPrice) * i / 4).toFixed(0)}</text>
            <text x={width - right + 7} y={y + 4} fill="hsl(var(--primary))" fontSize={10}>{(chart.maxAmount * (1 - i / 4) / 1e8).toFixed(0)}</text>
          </g>
        })}
        <g data-testid="history-candles">
          {points.map((point, i) => {
            const color = point.close >= point.open ? 'hsl(var(--destructive))' : 'hsl(var(--success))'
            const bodyWidth = Math.max(1, Math.min(14, chart.step * 0.6))
            return <g key={point.date}>
              <line x1={x(i)} x2={x(i)} y1={yPrice(point.high)} y2={yPrice(point.low)} stroke={color} />
              <rect x={x(i) - bodyWidth / 2} y={yPrice(Math.max(point.open, point.close))} width={bodyWidth} height={Math.max(1, Math.abs(yPrice(point.open) - yPrice(point.close)))} fill={color} opacity={0.85} />
            </g>
          })}
        </g>
        <path data-testid="history-turnover-line" d={chart.path} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinejoin="round" />
        {points.map((point, i) => point.totalTurnover === null ? null : <circle key={point.date} cx={x(i)} cy={yAmount(point.totalTurnover)} r={1.5} fill="hsl(var(--primary))" />)}
        <line x1={x(selected)} x2={x(selected)} y1={top} y2={height - bottom} stroke="hsl(var(--foreground))" strokeDasharray="3 4" opacity={0.5} />
        {active.totalTurnover !== null && <circle cx={x(selected)} cy={yAmount(active.totalTurnover)} r={4} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />}
        {chart.dateTicks.map((i) => <text key={i} x={x(i)} y={height - 12} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} fill="currentColor" fontSize={10}>{points[i].date.slice(5)}</text>)}
      </svg>
    </div>
  )
}
