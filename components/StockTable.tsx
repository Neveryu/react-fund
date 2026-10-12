'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { toSecid } from '@/lib/client-api'
import type { StockData } from '@/lib/data'
import { ArrowUpDown, ArrowUpRight, ArrowDownRight, X, Plus, Check } from 'lucide-react'

type SortKey = 'changePercent' | 'price' | 'turnover'

interface StockTableProps {
  stocks: StockData[]
  onRemove?: (code: string) => void
  /** 一键加入自选（热门成交模式） */
  onAddStock?: (stock: StockData) => void
  /** 已在自选中的股票代码 */
  existingCodes?: string[]
}

export default function StockTable({ stocks, onRemove, onAddStock, existingCodes }: StockTableProps) {
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
              {(onRemove || onAddStock) && <th className="p-3 w-10"></th>}
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
                  {!onRemove && onAddStock && (() => {
                    const added = existingCodes?.includes(toSecid(stock.code))
                    return (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => !added && onAddStock(stock)}
                          disabled={added}
                          title={added ? '已在我的自选' : '加入自选股票'}
                          className={cn(
                            'p-1 rounded-md transition-all',
                            added
                              ? 'text-success opacity-100 cursor-default'
                              : 'opacity-40 hover:opacity-100 hover:bg-primary/10'
                          )}
                        >
                          {added ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />}
                        </button>
                      </td>
                    )
                  })()}
                </tr>
              )
            })}
          </tbody>
        </table>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 text-xs text-muted-foreground bg-secondary/30">
        <span>共 {stocks.length} 只股票</span>
      </div>
    </div>
  )
}
