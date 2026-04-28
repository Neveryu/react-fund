'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { SectorCapitalFlowData } from '@/lib/data'
import { ArrowUpDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

type SortKey = 'mainNetInflow' | 'changePercent'

function formatFlow(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1e8) return (value / 1e8).toFixed(2) + '亿'
  if (abs >= 1e4) return (value / 1e4).toFixed(2) + '万'
  return value.toFixed(2)
}

export default function CapitalFlowTable({ data }: { data: SectorCapitalFlowData[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('mainNetInflow')
  const [sortDesc, setSortDesc] = useState(true)

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">暂无资金流向数据</p>
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
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

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 opacity-40" />
    return sortDesc ? (
      <ArrowUpRight className="h-3 w-3" />
    ) : (
      <ArrowDownRight className="h-3 w-3" />
    )
  }

  const renderChange = (value: number) => {
    const isPositive = value >= 0
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 font-medium tabular-nums',
          isPositive ? 'text-success' : 'text-destructive'
        )}
      >
        {isPositive ? '+' : ''}
        {value.toFixed(2)}%
      </span>
    )
  }

  const renderFlow = (value: number) => {
    const isPositive = value >= 0
    return (
      <span
        className={cn(
          'font-medium tabular-nums',
          isPositive ? 'text-success' : 'text-destructive'
        )}
      >
        {formatFlow(value)}
      </span>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left p-3 text-muted-foreground font-medium w-12">排名</th>
              <th className="text-left p-3 text-muted-foreground font-medium">板块名称</th>
              <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('changePercent')}
              >
                <span className="inline-flex items-center gap-1">
                  涨跌幅 <SortIcon column="changePercent" />
                </span>
              </th>
              <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('mainNetInflow')}
              >
                <span className="inline-flex items-center gap-1">
                  主力净流入 <SortIcon column="mainNetInflow" />
                </span>
              </th>
              <th className="text-right p-3 text-muted-foreground font-medium hidden md:table-cell">
                主力净占比
              </th>
              <th className="text-right p-3 text-muted-foreground font-medium hidden lg:table-cell">
                超大单
              </th>
              <th className="text-right p-3 text-muted-foreground font-medium hidden lg:table-cell">
                大单
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => (
              <tr
                key={item.code}
                className={cn(
                  'border-t border-border/50 transition-colors hover:bg-secondary/30',
                  i % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                )}
              >
                <td className="p-3">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold',
                      i < 3
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="p-3">
                  <div className="font-medium">{item.name}</div>
                </td>
                <td className="text-right p-3">{renderChange(item.changePercent)}</td>
                <td className="text-right p-3">{renderFlow(item.mainNetInflow)}</td>
                <td className="text-right p-3 hidden md:table-cell">
                  {renderChange(item.mainNetRatio)}
                </td>
                <td className="text-right p-3 hidden lg:table-cell">
                  {renderFlow(item.superLargeNet)}
                </td>
                <td className="text-right p-3 hidden lg:table-cell">
                  {renderFlow(item.largeNet)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
