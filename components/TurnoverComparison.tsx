'use client'

import { useState, useMemo, useRef } from 'react'
import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TurnoverTrendData, TurnoverTrendPoint } from '@/lib/data'

/** 格式化成交额为"xx亿"（原型图中使用亿为单位） */
function formatYi(value: number): string {
  const yi = value / 1e8
  if (yi >= 10000) return (yi / 10000).toFixed(2) + '万亿'
  return yi.toFixed(0) + '亿'
}

/** 格式化成交额为"xx亿元" */
function formatYiYuan(value: number): string {
  const yi = value / 1e8
  if (yi >= 10000) return (yi / 10000).toFixed(2) + '万亿元'
  return yi.toFixed(0) + '亿元'
}

/**
 * 将 HH:mm 时间字符串转换为分钟序号（0 表示 9:30，午休期跳过）
 * 上午：9:30~11:30 → 0~120
 * 下午：13:00~15:00 → 120~240
 */
function timeToMinuteIndex(time: string): number {
  const [h, m] = time.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return -1
  const total = h * 60 + m
  const morningStart = 9 * 60 + 30    // 570
  const morningEnd = 11 * 60 + 30     // 690
  const afternoonStart = 13 * 60       // 780
  const afternoonEnd = 15 * 60         // 900
  if (total < morningStart) return 0
  if (total <= morningEnd) return total - morningStart
  if (total < afternoonStart) return 120
  if (total <= afternoonEnd) return 120 + (total - afternoonStart)
  return 240
}

const TOTAL_MINUTES = 240  // 上午 120 分钟 + 下午 120 分钟

type Tab = 'today' | 'history'

interface Props {
  data: TurnoverTrendData | null
}

export default function TurnoverComparison({ data }: Props) {
  const [tab, setTab] = useState<Tab>('today')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // 构建图表点位
  const chart = useMemo(() => {
    if (!data) return null
    const width = 700
    const height = 260
    const padding = { top: 40, right: 20, bottom: 30, left: 20 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom

    const todayArr = data.today
    const prevArr = data.prev

    const maxTurnover = Math.max(
      ...todayArr.map((p) => p.turnover),
      ...prevArr.map((p) => p.turnover),
      1,
    )

    const toXY = (p: TurnoverTrendPoint) => {
      const idx = timeToMinuteIndex(p.time)
      const x = padding.left + (idx / TOTAL_MINUTES) * chartW
      const y = padding.top + chartH - (p.turnover / maxTurnover) * chartH
      return { x, y, idx, time: p.time, turnover: p.turnover }
    }

    const todayPoints = todayArr.map(toXY)
    const prevPoints = prevArr.map(toXY)

    const buildPath = (pts: { x: number; y: number }[]) =>
      pts.length > 0
        ? pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
        : ''

    const todayPath = buildPath(todayPoints)
    const prevPath = buildPath(prevPoints)

    return {
      width, height, padding, chartW, chartH, maxTurnover,
      todayPoints, prevPoints, todayPath, prevPath,
    }
  }, [data])

  if (!data || !chart) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          暂无成交数据
        </div>
      </div>
    )
  }

  const { width, height, padding, chartW, chartH, todayPoints, prevPoints, todayPath, prevPath } = chart

  // hover 的点（默认显示当前最新点）
  const activeIdx = hoverIndex !== null
    ? hoverIndex
    : (todayPoints.length > 0 ? todayPoints.length - 1 : 0)
  const activePoint = todayPoints[activeIdx]

  // 当前时间位置（用于虚线）
  const currentX = todayPoints.length > 0
    ? todayPoints[todayPoints.length - 1].x
    : padding.left

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || todayPoints.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const relX = ((e.clientX - rect.left) / rect.width) * width
    // 找最接近的 today 点
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < todayPoints.length; i++) {
      const d = Math.abs(todayPoints[i].x - relX)
      if (d < bestDist) { bestDist = d; best = i }
    }
    setHoverIndex(best)
  }

  const handleMouseLeave = () => setHoverIndex(null)

  // 涨跌幅颜色
  const pctColor = (v: number) =>
    v > 0 ? 'text-destructive' : v < 0 ? 'text-success' : 'text-muted-foreground'
  const pctText = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`

  const growthPositive = data.growthPercent >= 0

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* 顶部 tab */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('today')}
            className={cn(
              'flex items-center gap-1.5 text-base font-semibold transition-colors',
              tab === 'today' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            今日成交
            {tab === 'today' && <BookOpen className="h-4 w-4 text-primary" />}
          </button>
        </div>
        <button
          onClick={() => setTab('history')}
          className={cn(
            'text-sm transition-colors',
            tab === 'history' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          历史成交
        </button>
      </div>

      {tab === 'today' ? (
        <div className="p-5 space-y-4">
          {/* 描述文字 */}
          <p className="text-sm leading-relaxed text-foreground">
            截止 <span className="font-medium">{data.currentTime || '--:--'}</span>，累计成交相比上一交易日同时点
            <span className={cn('font-semibold mx-1', growthPositive ? 'text-destructive' : 'text-success')}>
              {growthPositive ? '增长' : '下降'} {Math.abs(data.growthPercent).toFixed(2)}%
            </span>
            ，{growthPositive ? '市场相对活跃。' : '市场相对平淡。'}
          </p>

          {/* 图表区域 */}
          <div className="rounded-lg bg-secondary/30 p-4">
            {/* 图例 */}
            <div className="flex items-center gap-5 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">今日</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <span className="text-xs text-muted-foreground">上个交易日</span>
              </div>
            </div>

            {/* SVG 折线图 */}
            <div className="relative">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                width="100%"
                className="overflow-visible cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <linearGradient id="today-turnover-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* 今日面积 */}
                {todayPoints.length > 1 && (
                  <path
                    d={`${todayPath} L${todayPoints[todayPoints.length - 1].x.toFixed(1)},${(padding.top + chartH).toFixed(1)} L${todayPoints[0].x.toFixed(1)},${(padding.top + chartH).toFixed(1)} Z`}
                    fill="url(#today-turnover-gradient)"
                  />
                )}

                {/* 上个交易日折线 */}
                {prevPoints.length > 1 && (
                  <path
                    d={prevPath}
                    fill="none"
                    stroke="hsl(var(--muted-foreground))"
                    strokeOpacity="0.45"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* 今日折线 */}
                {todayPoints.length > 1 && (
                  <path
                    d={todayPath}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* 当前时间虚线 */}
                {todayPoints.length > 0 && (
                  <line
                    x1={currentX}
                    x2={currentX}
                    y1={padding.top}
                    y2={padding.top + chartH}
                    stroke="hsl(var(--muted-foreground))"
                    strokeOpacity="0.35"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                )}

                {/* 活动点 */}
                {activePoint && (
                  <>
                    <circle
                      cx={activePoint.x}
                      cy={activePoint.y}
                      r="5"
                      fill="hsl(var(--primary))"
                      stroke="hsl(var(--background))"
                      strokeWidth="2"
                    />
                  </>
                )}

                {/* X 轴时间刻度 */}
                <text
                  x={padding.left}
                  y={height - 8}
                  fill="hsl(var(--muted-foreground))"
                  style={{ fontSize: '11px' }}
                >
                  9:30
                </text>
                <text
                  x={padding.left + chartW / 2}
                  y={height - 8}
                  textAnchor="middle"
                  fill="hsl(var(--muted-foreground))"
                  style={{ fontSize: '11px' }}
                >
                  11:30/13:00
                </text>
                <text
                  x={padding.left + chartW}
                  y={height - 8}
                  textAnchor="end"
                  fill="hsl(var(--muted-foreground))"
                  style={{ fontSize: '11px' }}
                >
                  15:00
                </text>
              </svg>

              {/* Tooltip */}
              {activePoint && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(activePoint.x / width) * 100}%`,
                    top: `${((activePoint.y - 30) / height) * 100}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div className="whitespace-nowrap rounded-md bg-primary/15 border border-primary/30 px-2.5 py-1 text-xs text-primary font-medium shadow-sm">
                    <span className="mr-1.5">●</span>
                    {activePoint.time} 成交额 {formatYi(activePoint.turnover)}元
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-2.5 text-sm">
            <div className="text-muted-foreground">
              上个交易日 <span className="text-foreground font-medium">成交额{formatYi(data.prevTotalTurnover)}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                沪 <span className={cn('font-semibold', pctColor(data.shChangePercent))}>{pctText(data.shChangePercent)}</span>
              </span>
              <span className="text-muted-foreground">
                深 <span className={cn('font-semibold', pctColor(data.szChangePercent))}>{pctText(data.szChangePercent)}</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-muted-foreground">
          历史成交数据即将上线
        </div>
      )}
    </div>
  )
}
