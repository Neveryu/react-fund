'use client'

import { useState, useEffect, useCallback } from 'react'

export interface WatchlistFund {
  code: string
  type: string
  manager?: string
}

export interface WatchlistStock {
  code: string
  market?: string
}

const FUND_KEY = 'watchlist-funds'
const STOCK_KEY = 'watchlist-stocks'

export const DEFAULT_FUNDS: WatchlistFund[] = [
  // —— 原有默认自选（场外为主）——
  { code: '005827', type: '混合型', manager: '张坤' },
  { code: '003095', type: '混合型', manager: '葛兰' },
  { code: '161725', type: '指数型', manager: '侯昊' },
  { code: '515860', type: 'ETF', manager: '尚可' },
  { code: '011123', type: '股票型', manager: '沈若雨' },
  { code: '000051', type: '指数型', manager: '赵宗庭' },
  // —— 宽基指数 ETF（大盘风向标）——
  { code: '510300', type: 'ETF' }, // 沪深300ETF华泰柏瑞
  { code: '510500', type: 'ETF' }, // 中证500ETF南方
  { code: '510050', type: 'ETF' }, // 上证50ETF华夏
  { code: '588000', type: 'ETF' }, // 科创50ETF华夏
  { code: '588080', type: 'ETF' }, // 科创50ETF易方达
  { code: '159915', type: 'ETF' }, // 创业板ETF易方达
  { code: '159949', type: 'ETF' }, // 创业板50ETF华安
  // —— 行业/主题 ETF ——
  { code: '512880', type: 'ETF' }, // 证券ETF国泰
  { code: '512480', type: 'ETF' }, // 半导体ETF国联安
  { code: '512760', type: 'ETF' }, // 芯片ETF国泰
  { code: '512010', type: 'ETF' }, // 医药ETF易方达
  { code: '512690', type: 'ETF' }, // 酒ETF鹏华
  { code: '159928', type: 'ETF' }, // 消费ETF汇添富
  { code: '512800', type: 'ETF' }, // 银行ETF华宝
  { code: '515790', type: 'ETF' }, // 光伏ETF华泰柏瑞
  { code: '512400', type: 'ETF' }, // 有色金属ETF南方
  // —— 跨境/商品 ETF ——
  { code: '513050', type: 'ETF' }, // 中概互联网ETF易方达
  { code: '513100', type: 'ETF' }, // 纳指ETF国泰
  { code: '513180', type: 'ETF' }, // 恒生科技ETF华夏
  { code: '518880', type: 'ETF' }, // 黄金ETF华安
]

export function useWatchlist() {
  const [fundList, setFundListState] = useState<WatchlistFund[]>(DEFAULT_FUNDS)
  const [stockList, setStockListState] = useState<WatchlistStock[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const savedFunds = localStorage.getItem(FUND_KEY)
      const savedStocks = localStorage.getItem(STOCK_KEY)
      if (savedFunds) setFundListState(JSON.parse(savedFunds))
      if (savedStocks) {
        const parsed = JSON.parse(savedStocks)
        // Backward compatibility: old format was string[]
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
          setStockListState(parsed.map((c: string) => ({ code: c })))
        } else {
          setStockListState(parsed)
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

  const addFund = useCallback((code: string, type: string, manager?: string) => {
    setFundListState((prev) => {
      if (prev.some((f) => f.code === code)) return prev
      const next = [...prev, { code, type, manager }]
      localStorage.setItem(FUND_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeFund = useCallback((code: string) => {
    setFundListState((prev) => {
      const next = prev.filter((f) => f.code !== code)
      localStorage.setItem(FUND_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const addStock = useCallback((code: string, market?: string) => {
    setStockListState((prev) => {
      if (prev.some((s) => s.code === code)) return prev
      const next = [...prev, { code, market }]
      localStorage.setItem(STOCK_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const removeStock = useCallback((code: string) => {
    setStockListState((prev) => {
      const next = prev.filter((s) => s.code !== code)
      localStorage.setItem(STOCK_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { fundList, stockList, addFund, removeFund, addStock, removeStock, mounted }
}
