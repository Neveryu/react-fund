'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { StockData } from '@/lib/data'
import { ArrowUpDown, ArrowUpRight, ArrowDownRight, X } from 'lucide-react'

type SortKey = 'changePercent' | 'price' | 'turnover'

export default function StockTable({ stocks, onRemove }: { stocks: StockData[]; onRemove?: (code: string) => void }) {
  const [sortKey, setSortKey] = useState<SortKey>('changePercent')
  const [sortDesc, setSortDesc] = useState(true)

  const sorted = [...stocks].sort((a, b) => {
    let aVal: number
    let bVal: number
    if (sortKey === 'turnover') {
      aVal = parseFloat(a.turnover)
      bVal = parseFloat(b.turnover)
    } else {
      aVal = a[sortKey]
      bVal = b[sortKey]
    }
    return sortDesc ? bVal - aVal : aVal - bVal
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(!sortDesc)
    } else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left p-3 text-muted-foreground font-medium">名称 / 代码</th>
              <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('price')}
              >
                <span className="inline-flex items-center gap-1">
                  现价 <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('changePercent')}
              >
                <span className="inline-flex items-center gap-1">
                  涨跌幅 <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              <th className="text-right p-3 text-muted-foreground font-medium hidden sm:table-cell">
                最高 / 最低
              </th>
              <th className="text-right p-3 text-muted-foreground font-medium hidden md:table-cell">
                成交量
              </th>
              <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors hidden lg:table-cell"
                onClick={() => toggleSort('turnover')}
              >
                <span className="inline-flex items-center gap-1">
                  成交额 <ArrowUpDown className="h-3 w-3" />
                </span>
              </th>
              {onRemove && <th className="p-3 w-10"></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((stock, i) => {
              const isPositive = stock.changePercent >= 0
              return (
                <tr
                  key={stock.code}
                  className={cn(
                    'border-t border-border/50 transition-colors hover:bg-secondary/30',
                    i % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                  )}
                >
                  <td className="p-3">
                    <div className="font-medium">{stock.name}</div>
                    <div className="text-xs text-muted-foreground">{stock.code}</div>
                  </td>
                  <td className="text-right p-3 tabular-nums font-medium">
                    {stock.price.toFixed(2)}
                  </td>
                  <td className="text-right p-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 font-medium tabular-nums',
                        isPositive ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {isPositive ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </td>
                  <td className="text-right p-3 tabular-nums text-muted-foreground hidden sm:table-cell">
                    <span className="text-success">{stock.high.toFixed(2)}</span>
                    {' / '}
                    <span className="text-destructive">{stock.low.toFixed(2)}</span>
                  </td>
                  <td className="text-right p-3 tabular-nums text-muted-foreground hidden md:table-cell">
                    {stock.volume}
                  </td>
                  <td className="text-right p-3 tabular-nums text-muted-foreground hidden lg:table-cell">
                    {stock.turnover}
                  </td>
                  {onRemove && (
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onRemove(stock.code)}
                        className="p-1 rounded-md opacity-40 hover:opacity-100 hover:bg-destructive/10 transition-all"
                        title="移除"
                      >
                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
