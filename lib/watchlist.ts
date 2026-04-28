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
  { code: '005827', type: '混合型', manager: '张坤' },
  { code: '003095', type: '混合型', manager: '葛兰' },
  { code: '161725', type: '指数型', manager: '侯昊' },
  { code: '515860', type: 'ETF', manager: '李宁' },
  { code: '011123', type: '混合型', manager: '过蓓蓓' },
  { code: '000051', type: '指数型', manager: '张弘弢' },
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
