'use client'

import { useState, useEffect, useCallback } from 'react'
import MarketTicker from '@/components/MarketTicker'
import IndexCard from '@/components/IndexCard'
import StockTable from '@/components/StockTable'
import FundCard from '@/components/FundCard'
import FundRankingTable from '@/components/FundRankingTable'
import SearchModal from '@/components/SearchModal'
import { Card, CardContent } from '@/components/ui/card'
import {
  globalIndices as mockIndices,
  hotStocks as mockStocks,
  funds as mockFunds,
  fundRanking as mockFundRanking,
} from '@/lib/data'
import type { IndexData, StockData, FundData, FundRankingData } from '@/lib/data'
import {
  TrendingUp,
  BarChart3,
  Wallet,
  RefreshCw,
  Plus,
  Search as SearchIcon,
  BarChart2,
} from 'lucide-react'
import {
  fetchIndices,
  fetchHotStocks,
  fetchFundsByCodes,
  fetchStocksByCodes,
  fetchFundRanking,
} from '@/lib/client-api'
import { useWatchlist } from '@/lib/watchlist'
import { cn } from '@/lib/utils'

export default function LiveDashboard() {
  const { fundList, stockCodes, addFund, removeFund, addStock, removeStock, mounted } =
    useWatchlist()

  const [indices, setIndices] = useState<IndexData[]>(mockIndices)
  const [hotStocks, setHotStocks] = useState<StockData[]>(mockStocks)
  const [watchlistStocks, setWatchlistStocks] = useState<StockData[]>([])
  const [funds, setFunds] = useState<FundData[]>(mockFunds)
  const [fundRanking, setFundRanking] = useState<FundRankingData[]>(mockFundRanking)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLive, setIsLive] = useState(false)

  const [stockTab, setStockTab] = useState<'hot' | 'watchlist'>('hot')
  const [searchType, setSearchType] = useState<'fund' | 'stock' | null>(null)

  const fetchAllData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const [indicesRes, hotStocksRes, watchlistStocksRes, fundsRes, rankingRes] =
        await Promise.allSettled([
          fetchIndices(),
          fetchHotStocks(),
          stockCodes.length > 0
            ? fetchStocksByCodes(stockCodes)
            : Promise.resolve([] as StockData[]),
          fundList.length > 0
            ? fetchFundsByCodes(fundList)
            : Promise.resolve([] as FundData[]),
          fetchFundRanking(),
        ])

      if (indicesRes.status === 'fulfilled' && indicesRes.value?.length) {
        setIndices(indicesRes.value)
        setIsLive(true)
      }
      if (hotStocksRes.status === 'fulfilled' && hotStocksRes.value?.length) {
        setHotStocks(hotStocksRes.value)
      }
      if (watchlistStocksRes.status === 'fulfilled') {
        setWatchlistStocks(watchlistStocksRes.value || [])
      }
      if (fundsRes.status === 'fulfilled' && fundsRes.value?.length) {
        setFunds(fundsRes.value)
      }
      if (rankingRes.status === 'fulfilled' && rankingRes.value?.length) {
        setFundRanking(rankingRes.value)
      }

      setLastUpdate(new Date().toLocaleTimeString('zh-CN'))
    } catch (e) {
      console.error('Failed to refresh market data:', e)
    } finally {
      setIsRefreshing(false)
    }
  }, [fundList, stockCodes])

  useEffect(() => {
    if (!mounted) return
    fetchAllData()
    const interval = setInterval(fetchAllData, 30000)
    return () => clearInterval(interval)
  }, [fetchAllData, mounted])

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
        <section className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            label="全球指数"
            value={`${indices.length} 个`}
            sub={`${upCount} 涨 · ${downCount} 跌`}
            href="#indices"
          />
          <StatCard
            icon={<BarChart3 className="h-5 w-5 text-accent" />}
            label="股票行情"
            value={`${hotStocks.length} 只`}
            sub={stockCodes.length > 0 ? `自选 ${stockCodes.length} 只` : 'A股热门'}
            href="#stocks"
          />
          <StatCard
            icon={<Wallet className="h-5 w-5 text-success" />}
            label="跟踪基金"
            value={`${funds.length} 只`}
            sub="每日更新"
            href="#funds"
          />
        </section>

        {/* Global Indices */}
        <section id="indices">
          <SectionHeader title="全球指数" subtitle="主要市场实时行情" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mt-4">
            {indices.map((index) => (
              <IndexCard key={index.code} data={index} />
            ))}
          </div>
        </section>

        {/* Stocks */}
        <section id="stocks">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <SectionHeader
              title="股票行情"
              subtitle={stockTab === 'hot' ? '今日热门成交个股' : '我的自选股票'}
            />
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs">
                <button
                  onClick={() => setStockTab('hot')}
                  className={cn(
                    'px-3 py-1.5 transition-colors',
                    stockTab === 'hot'
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  热门成交
                </button>
                <button
                  onClick={() => setStockTab('watchlist')}
                  className={cn(
                    'px-3 py-1.5 transition-colors',
                    stockTab === 'watchlist'
                      ? 'bg-primary/15 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )}
                >
                  我的自选
                  {stockCodes.length > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">
                      ({stockCodes.length})
                    </span>
                  )}
                </button>
              </div>
              <button
                onClick={() => {
                  setSearchType('stock')
                  setStockTab('watchlist')
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 hover:bg-secondary transition-colors"
                title="添加自选股票"
              >
                <Plus className="h-3.5 w-3.5 text-primary" />
              </button>
            </div>
          </div>
          <div className="mt-6">
            {stockTab === 'hot' ? (
              <StockTable stocks={hotStocks} />
            ) : watchlistStocks.length > 0 ? (
              <StockTable stocks={watchlistStocks} onRemove={removeStock} />
            ) : (
              <EmptyWatchlist
                message="暂无自选股票"
                actionLabel="添加自选股票"
                onAction={() => setSearchType('stock')}
              />
            )}
          </div>
        </section>

        {/* Fund Tracker */}
        <section id="funds">
          <div className="flex items-center justify-between">
            <SectionHeader title="基金跟踪" subtitle="实盘持仓净值跟踪" />
            <button
              onClick={() => setSearchType('fund')}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 hover:bg-secondary transition-colors"
              title="添加基金"
            >
              <Plus className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 mt-3">
            {funds.length > 0 ? (
              funds.map((fund) => (
                <FundCard
                  key={fund.code}
                  data={fund}
                  onRemove={() => removeFund(fund.code)}
                />
              ))
            ) : (
              <div className="col-span-full">
                <EmptyWatchlist
                  message="暂无跟踪基金"
                  actionLabel="添加基金"
                  onAction={() => setSearchType('fund')}
                />
              </div>
            )}
          </div>
        </section>

        {/* Fund Ranking */}
        <section id="fund-ranking">
          <SectionHeader title="当日基金涨跌幅排行榜" subtitle="全市场基金实时排行" />
          <div className="mt-4">
            <FundRankingTable data={fundRanking} />
          </div>
        </section>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchType !== null}
        onClose={() => setSearchType(null)}
        type={searchType || 'fund'}
        existingCodes={
          searchType === 'fund' ? fundList.map((f) => f.code) : stockCodes
        }
        onAdd={(code, meta, manager) => {
          if (searchType === 'fund') addFund(code, meta || '基金', manager)
          else addStock(code)
        }}
        onRemove={(code) => {
          if (searchType === 'fund') removeFund(code)
          else removeStock(code)
        }}
      />
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
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  href?: string
}) {
  const content = (
    <Card className="transition-colors hover:bg-secondary/50 cursor-pointer">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-base font-bold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground leading-tight">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    )
  }
  return content
}

function EmptyWatchlist({
  message,
  actionLabel,
  onAction,
}: {
  message: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border">
      <SearchIcon className="h-8 w-8 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      <button
        onClick={onAction}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
      >
        <Plus className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  )
}
