'use client'

import { useState, useEffect, useCallback } from 'react'
import MarketTicker from '@/components/MarketTicker'
import IndexCard from '@/components/IndexCard'
import StockTable from '@/components/StockTable'
import FundCard from '@/components/FundCard'
import { Card, CardContent } from '@/components/ui/card'
import {
  globalIndices as mockIndices,
  hotStocks as mockStocks,
  funds as mockFunds,
} from '@/lib/data'
import type { IndexData, StockData, FundData } from '@/lib/data'
import { TrendingUp, BarChart3, Wallet, RefreshCw } from 'lucide-react'
import { fetchIndices, fetchHotStocks, fetchFunds } from '@/lib/client-api'
import { cn } from '@/lib/utils'

export default function LiveDashboard() {
  const [indices, setIndices] = useState<IndexData[]>(mockIndices)
  const [stocks, setStocks] = useState<StockData[]>(mockStocks)
  const [funds, setFunds] = useState<FundData[]>(mockFunds)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLive, setIsLive] = useState(false)

  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [indicesRes, stocksRes, fundsRes] = await Promise.allSettled([
        fetchIndices(),
        fetchHotStocks(),
        fetchFunds(),
      ])

      if (indicesRes.status === 'fulfilled' && indicesRes.value?.length) {
        setIndices(indicesRes.value)
        setIsLive(true)
      }
      if (stocksRes.status === 'fulfilled' && stocksRes.value?.length) {
        setStocks(stocksRes.value)
      }
      if (fundsRes.status === 'fulfilled' && fundsRes.value?.length) {
        setFunds(fundsRes.value)
      }

      setLastUpdate(new Date().toLocaleTimeString('zh-CN'))
    } catch (e) {
      console.error('Failed to refresh market data:', e)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(fetchAllData, 30000)
    return () => clearInterval(interval)
  }, [fetchAllData])

  const upCount = indices.filter((i) => i.changePercent > 0).length
  const downCount = indices.filter((i) => i.changePercent < 0).length

  return (
    <>
      <MarketTicker indices={indices} />

      <div className="container space-y-12 py-8">
        {/* Status bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <span>实时数据</span>
              </>
            ) : (
              <span>模拟数据</span>
            )}
            {lastUpdate && <span>· 更新于 {lastUpdate}</span>}
          </div>
          <button
            onClick={fetchAllData}
            disabled={isRefreshing}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
            刷新
          </button>
        </div>

        {/* Summary Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            label="全球指数"
            value={`${indices.length} 个`}
            sub={`${upCount} 涨 · ${downCount} 跌`}
          />
          <StatCard
            icon={<BarChart3 className="h-5 w-5 text-accent" />}
            label="热门股票"
            value={`${stocks.length} 只`}
            sub="A股 · 港股"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5 text-success" />}
            label="跟踪基金"
            value={`${funds.length} 只`}
            sub="每日更新"
          />
        </section>

        {/* Global Indices */}
        <section id="indices">
          <SectionHeader title="全球指数" subtitle="主要市场实时行情" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {indices.map((index) => (
              <IndexCard key={index.code} data={index} />
            ))}
          </div>
        </section>

        {/* Hot Stocks */}
        <section id="stocks">
          <SectionHeader title="热门股票" subtitle="今日热门成交个股" />
          <div className="mt-6">
            <StockTable stocks={stocks} />
          </div>
        </section>

        {/* Fund Tracker */}
        <section id="funds">
          <SectionHeader title="基金跟踪" subtitle="实盘持仓净值跟踪" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {funds.map((fund) => (
              <FundCard key={fund.code} data={fund} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

/* ── Local helper components ── */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}
