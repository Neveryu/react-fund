'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import MarketTicker from '@/components/MarketTicker'
import IndexCard from '@/components/IndexCard'
import StockTable from '@/components/StockTable'
import FundCard from '@/components/FundCard'
import FundRankingTable from '@/components/FundRankingTable'
import DailyMarketAnalysis from '@/components/DailyMarketAnalysis'
import SearchModal from '@/components/SearchModal'
import ScrollToTop from '@/components/ScrollToTop'
import IndexChartModal from '@/components/IndexChartModal'
import FundDetailModal from '@/components/FundDetailModal'
import AiSettingsModal from '@/components/AiSettingsModal'
import { Card, CardContent } from '@/components/ui/card'
import type { IndexData, StockData, FundData, FundRankingData, DailyAnalysisData, DailyAiAnalysis } from '@/lib/data'
import {
  TrendingUp,
  BarChart3,
  Wallet,
  RefreshCw,
  Plus,
  Search as SearchIcon,
  BarChart2,
  Settings,
} from 'lucide-react'
import {
  fetchIndices,
  fetchHotStocks,
  fetchFundsByCodes,
  fetchStocksByCodes,
  fetchFundRanking,
  fetchYesterdayFundRanking,
  fetchFundDetail,
  fetchDailyAnalysis,
  generateDailyAiAnalysis,
} from '@/lib/client-api'
import { useWatchlist } from '@/lib/watchlist'
import { cn } from '@/lib/utils'

const FAST_REFRESH_INTERVAL = 30_000
const MEDIUM_REFRESH_INTERVAL = 5 * 60_000
const SLOW_REFRESH_INTERVAL = 30 * 60_000
const AI_REFRESH_INTERVAL = 15 * 60_000

export default function LiveDashboard() {
  const { fundList, stockList, addFund, removeFund, addStock, removeStock, mounted } =
    useWatchlist()

  const [indices, setIndices] = useState<IndexData[]>([])
  const [hotStocks, setHotStocks] = useState<StockData[]>([])
  const [watchlistStocks, setWatchlistStocks] = useState<StockData[]>([])
  const [funds, setFunds] = useState<FundData[]>([])
  const [isFundsLoading, setIsFundsLoading] = useState(true)
  const [fundRanking, setFundRanking] = useState<FundRankingData[]>([])
  const [yesterdayFundRanking, setYesterdayFundRanking] = useState<FundRankingData[]>([])
  const [fundRankingTab, setFundRankingTab] = useState<'today' | 'yesterday'>('today')
  const [dailyAnalysis, setDailyAnalysis] = useState<DailyAnalysisData>({
    marketStats: null,
    industrySectors: [],
    allIndustrySectors: [],
    conceptSectors: [],
    capitalFlow: [],
    turnoverTrend: null,
    heatmapData: [],
  })
  const [aiAnalysis, setAiAnalysis] = useState<DailyAiAnalysis | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [isAiAnalysisLoading, setIsAiAnalysisLoading] = useState(false)

  const [stockTab, setStockTab] = useState<'hot' | 'watchlist'>('hot')
  const [searchType, setSearchType] = useState<'fund' | 'stock' | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<IndexData | null>(null)
  const [selectedFund, setSelectedFund] = useState<FundRankingData | FundData | null>(null)
  const [isLoadingFundDetail, setIsLoadingFundDetail] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const refreshInFlightRef = useRef(false)
  const aiInFlightRef = useRef(false)
  const aiAnalysisRef = useRef<DailyAiAnalysis | null>(null)
  const lastMediumRefreshRef = useRef(0)
  const lastSlowRefreshRef = useRef(0)
  const lastAiRefreshRef = useRef(0)
  const lastAiFingerprintRef = useRef('')
  const hasInitialRefreshRef = useRef(false)
  const indicesRef = useRef<IndexData[]>([])
  const dailyAnalysisRef = useRef(dailyAnalysis)
  const fundsRef = useRef<FundData[]>([])
  const fundListRef = useRef(fundList)
  const stockListRef = useRef(stockList)

  useEffect(() => {
    fundListRef.current = fundList
  }, [fundList])

  useEffect(() => {
    stockListRef.current = stockList
  }, [stockList])

  const handleSelectFund = async (fund: FundRankingData | FundData) => {
    setSelectedFund(fund)
    setIsLoadingFundDetail(true)
    try {
      const detail = await fetchFundDetail(fund.code)
      if (detail) {
        setSelectedFund((prev) => prev ? { ...prev, ...detail } : prev)
      }
    } catch (e) {
      console.error('Failed to fetch fund detail:', e)
    } finally {
      setIsLoadingFundDetail(false)
    }
  }

  const refreshAiAnalysis = useCallback((nextIndices: IndexData[], nextDailyAnalysis: DailyAnalysisData, force = false) => {
    if (!nextIndices.length || !nextDailyAnalysis.marketStats || aiInFlightRef.current) return

    const fingerprint = JSON.stringify({
      date: new Date().toLocaleDateString('zh-CN'),
      indices: nextIndices.map(({ code, value, changePercent }) => [code, value, changePercent]),
      marketStats: nextDailyAnalysis.marketStats,
      industries: nextDailyAnalysis.industrySectors.slice(0, 5).map(({ code, changePercent }) => [code, changePercent]),
      capitalFlow: nextDailyAnalysis.capitalFlow.slice(0, 5).map(({ code, mainNetInflow }) => [code, mainNetInflow]),
    })
    const now = Date.now()
    if (!force && (fingerprint === lastAiFingerprintRef.current || now - lastAiRefreshRef.current < AI_REFRESH_INTERVAL)) return

    aiInFlightRef.current = true
    setIsAiAnalysisLoading(true)
    generateDailyAiAnalysis(nextIndices, nextDailyAnalysis)
      .then((result) => {
        aiAnalysisRef.current = result
        setAiAnalysis(result)
        lastAiFingerprintRef.current = fingerprint
        lastAiRefreshRef.current = Date.now()
      })
      .catch((error) => console.error('Failed to generate AI analysis:', error))
      .finally(() => {
        aiInFlightRef.current = false
        setIsAiAnalysisLoading(false)
      })
  }, [])

  const fetchAllData = useCallback(async (forceFull = false) => {
    if (refreshInFlightRef.current) return
    if (!forceFull && document.visibilityState !== 'visible') return

    refreshInFlightRef.current = true
    setIsRefreshing(true)
    const now = Date.now()
    const shouldRefreshMedium = forceFull || now - lastMediumRefreshRef.current >= MEDIUM_REFRESH_INTERVAL
    const shouldRefreshSlow = forceFull || now - lastSlowRefreshRef.current >= SLOW_REFRESH_INTERVAL
    if (shouldRefreshMedium) setIsFundsLoading(true)

    try {
      const currentFundList = fundListRef.current
      const currentStockList = stockListRef.current
      const [indicesRes, hotStocksRes, watchlistStocksRes, fundsRes, rankingRes, yesterdayRankingRes, dailyRes] = await Promise.allSettled([
        fetchIndices({ includeSparkline: shouldRefreshSlow }),
        fetchHotStocks(),
        currentStockList.length > 0
          ? fetchStocksByCodes(currentStockList.map((s) => s.code))
          : Promise.resolve([] as StockData[]),
        shouldRefreshMedium
          ? currentFundList.length > 0
            ? fetchFundsByCodes(currentFundList, { includeHistory: shouldRefreshSlow })
            : Promise.resolve([] as FundData[])
          : Promise.resolve(null),
        shouldRefreshSlow ? fetchFundRanking() : Promise.resolve(null),
        shouldRefreshSlow ? fetchYesterdayFundRanking() : Promise.resolve(null),
        shouldRefreshMedium ? fetchDailyAnalysis({ includeHeatmap: shouldRefreshSlow }) : Promise.resolve(null),
      ])

      let hasSuccessfulUpdate = false
      let nextIndices = indicesRef.current
      let nextDailyAnalysis = dailyAnalysisRef.current

      if (indicesRes.status === 'fulfilled' && indicesRes.value?.length) {
        nextIndices = indicesRes.value.map((item) => ({
          ...item,
          sparkline: item.sparkline?.length
            ? item.sparkline
            : indicesRef.current.find((current) => current.code === item.code)?.sparkline || [],
        }))
        indicesRef.current = nextIndices
        setIndices(nextIndices)
        setIsLive(true)
        hasSuccessfulUpdate = true
      }
      if (hotStocksRes.status === 'fulfilled' && hotStocksRes.value?.length) {
        setHotStocks(hotStocksRes.value)
        hasSuccessfulUpdate = true
      }
      if (watchlistStocksRes.status === 'fulfilled') {
        setWatchlistStocks(watchlistStocksRes.value || [])
        hasSuccessfulUpdate = true
      }
      if (fundsRes.status === 'fulfilled' && fundsRes.value !== null) {
        const nextFunds = fundsRes.value.map((fund) => {
          const previous = fundsRef.current.find((item) => item.code === fund.code)
          return {
            ...fund,
            returns: fund.returns || previous?.returns,
            sparkline: fund.sparkline?.length ? fund.sparkline : previous?.sparkline,
          }
        })
        fundsRef.current = nextFunds
        setFunds(nextFunds)
        hasSuccessfulUpdate = true
      }
      if (rankingRes.status === 'fulfilled' && rankingRes.value?.length) {
        setFundRanking(rankingRes.value)
        hasSuccessfulUpdate = true
      }
      if (yesterdayRankingRes.status === 'fulfilled' && yesterdayRankingRes.value?.length) {
        setYesterdayFundRanking(yesterdayRankingRes.value)
        hasSuccessfulUpdate = true
      }
      if (dailyRes.status === 'fulfilled' && dailyRes.value !== null) {
        nextDailyAnalysis = {
          ...dailyRes.value,
          heatmapData: dailyRes.value.heatmapData.length
            ? dailyRes.value.heatmapData
            : dailyAnalysisRef.current.heatmapData,
        }
        dailyAnalysisRef.current = nextDailyAnalysis
        setDailyAnalysis(nextDailyAnalysis)
        hasSuccessfulUpdate = true
      }

      if (shouldRefreshMedium) lastMediumRefreshRef.current = Date.now()
      if (shouldRefreshSlow) lastSlowRefreshRef.current = Date.now()
      if (hasSuccessfulUpdate) {
        setLastUpdate(new Date().toLocaleTimeString('zh-CN'))
      }
      refreshAiAnalysis(nextIndices, nextDailyAnalysis, forceFull && !aiAnalysisRef.current)
    } catch (e) {
      console.error('Failed to refresh market data:', e)
    } finally {
      setIsFundsLoading(false)
      setIsRefreshing(false)
      refreshInFlightRef.current = false
    }
  }, [refreshAiAnalysis])

  useEffect(() => {
    if (!mounted || !hasInitialRefreshRef.current) return
    lastMediumRefreshRef.current = 0
    void fetchAllData()
  }, [fundList, mounted, fetchAllData])

  useEffect(() => {
    if (!mounted || !hasInitialRefreshRef.current) return
    void fetchAllData()
  }, [stockList, mounted, fetchAllData])

  useEffect(() => {
    if (!mounted) return
    void fetchAllData(true).finally(() => {
      hasInitialRefreshRef.current = true
    })
    const interval = window.setInterval(() => void fetchAllData(), FAST_REFRESH_INTERVAL)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void fetchAllData()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
              <span>{isRefreshing ? '正在连接数据源' : '数据源未连接'}</span>
            )}
            {lastUpdate && <span>· 更新于 {lastUpdate}</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="h-7 w-7 flex items-center justify-center rounded-md border border-border/50 hover:bg-secondary transition-colors"
              title="AI 设置"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => void fetchAllData(true)}
              disabled={isRefreshing}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-2 py-1 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('h-3 w-3', isRefreshing && 'animate-spin')} />
              刷新
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            label="全球指数"
            value={`${indices.length} 个`}
            sub={`${upCount} 涨 · ${downCount} 跌`}
            href="#indices"
          />
          <StatCard
            icon={<BarChart2 className="h-5 w-5 text-accent" />}
            label="每日播报"
            value={
              dailyAnalysis.marketStats
                ? `${dailyAnalysis.marketStats.advancers}↑ ${dailyAnalysis.marketStats.decliners}↓`
                : '加载中'
            }
            sub={
              dailyAnalysis.marketStats
                ? `成交 ${dailyAnalysis.marketStats.totalTurnover >= 1e12 ? (dailyAnalysis.marketStats.totalTurnover / 1e12).toFixed(2) + '万亿' : (dailyAnalysis.marketStats.totalTurnover / 1e8).toFixed(0) + '亿'}`
                : '大盘概况'
            }
            href="#daily"
          />
          <StatCard
            icon={<BarChart3 className="h-5 w-5 text-accent" />}
            label="股票行情"
            value={`${hotStocks.length} 只`}
            sub={stockList.length > 0 ? `自选 ${stockList.length} 只` : 'A股热门'}
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
          <div className="flex gap-2 mt-4 overflow-x-auto p-2 -m-2">
            {indices.length > 0 ? (
              indices.map((index) => (
                <IndexCard key={index.code} data={index} onClick={setSelectedIndex} />
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground text-sm">
                暂无全球指数数据，请检查网络连接
              </div>
            )}
          </div>
        </section>

        {/* Daily Market Analysis */}
        <section id="daily">
          <SectionHeader title="每日股市分析" subtitle="大盘概况 · 板块热度 · 资金流向" />
          <div className="mt-4">
            <DailyMarketAnalysis
              data={dailyAnalysis}
              indices={indices}
              aiAnalysis={aiAnalysis}
              isAiLoading={isAiAnalysisLoading}
              isLoading={isRefreshing}
            />
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
                  onClick={() => handleSelectFund(fund)}
                />
              ))
            ) : fundList.length > 0 && isFundsLoading ? (
              <div className="col-span-full flex items-center justify-center rounded-lg border border-dashed border-border py-10 text-sm text-muted-foreground">
                正在加载跟踪基金数据...
              </div>
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
          <SectionHeader
            title="基金涨跌幅排行榜"
            subtitle={fundRankingTab === 'today' ? '全市场基金今日排行' : '全市场基金昨日排行'}
          />
          <div className="mt-4">
            <FundRankingTable
              data={fundRankingTab === 'today' ? fundRanking : yesterdayFundRanking}
              onSelectFund={handleSelectFund}
              activeTab={fundRankingTab}
              onTabChange={setFundRankingTab}
            />
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
                  {stockList.length > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">
                      ({stockList.length})
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

      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchType !== null}
        onClose={() => setSearchType(null)}
        type={searchType || 'fund'}
        existingCodes={
          searchType === 'fund' ? fundList.map((f) => f.code) : stockList.map((s) => s.code)
        }
        onAdd={(code, meta, manager) => {
          if (searchType === 'fund') addFund(code, meta || '基金', manager)
          else addStock(code, meta)
        }}
        onRemove={(code) => {
          if (searchType === 'fund') removeFund(code)
          else removeStock(code)
        }}
      />
      <IndexChartModal index={selectedIndex} onClose={() => setSelectedIndex(null)} />
      <FundDetailModal
              fund={selectedFund}
              onClose={() => setSelectedFund(null)}
              isLoading={isLoadingFundDetail}
            />
      <AiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => refreshAiAnalysis(indicesRef.current, dailyAnalysisRef.current, true)}
      />
      <ScrollToTop />
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
      <CardContent className="flex flex-col items-center text-center p-3 sm:p-3 sm:flex-row sm:text-left sm:gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary mb-1.5 sm:mb-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
          <p className="text-base sm:text-lg font-bold leading-tight">{value}</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-tight truncate">{sub}</p>
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
