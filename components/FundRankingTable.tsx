'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { FundRankingData } from '@/lib/data'
import { ArrowUpDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

type SortKey = 'dayChange' | 'weekChange' | 'monthChange' | 'threeMonth' | 'sixMonth' | 'oneYear'
type RankingTab = 'today' | 'yesterday'

interface FundRankingTableProps {
  data: FundRankingData[]
  onSelectFund?: (fund: FundRankingData) => void
  activeTab?: RankingTab
  onTabChange?: (tab: RankingTab) => void
}

export default function FundRankingTable({
  data,
  onSelectFund,
  activeTab = 'today',
  onTabChange,
}: FundRankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('dayChange')
  const [sortDesc, setSortDesc] = useState(true)

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">暂无基金排行数据</p>
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

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* 切换按钮 */}
      {onTabChange && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30">
          <span className="text-sm font-medium text-muted-foreground">
            {activeTab === 'today' ? '今日排行' : '昨日排行'}
          </span>
          <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs">
            <button
              onClick={() => onTabChange('today')}
              className={cn(
                'px-3 py-1.5 transition-colors',
                activeTab === 'today'
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              今日排行
            </button>
            <button
              onClick={() => onTabChange('yesterday')}
              className={cn(
                'px-3 py-1.5 transition-colors',
                activeTab === 'yesterday'
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              昨日排行
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left p-3 text-muted-foreground font-medium w-12">排名</th>
              <th className="text-left p-3 text-muted-foreground font-medium">名称 / 代码</th>
              <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">
                类型
              </th>
              <th className="text-right p-3 text-muted-foreground font-medium">净值</th>
              <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => toggleSort('dayChange')}
              >
                <span className="inline-flex items-center gap-1">
                  {activeTab === 'yesterday' ? '昨日涨幅' : '日涨幅'} <SortIcon column="dayChange" />
                </span>
              </th>
              {activeTab === 'today' && <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors hidden md:table-cell"
                onClick={() => toggleSort('weekChange')}
              >
                <span className="inline-flex items-center gap-1">
                  近1周 <SortIcon column="weekChange" />
                </span>
              </th>}
              {activeTab === 'today' && <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors hidden md:table-cell"
                onClick={() => toggleSort('monthChange')}
              >
                <span className="inline-flex items-center gap-1">
                  近1月 <SortIcon column="monthChange" />
                </span>
              </th>}
              {activeTab === 'today' && <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors hidden lg:table-cell"
                onClick={() => toggleSort('threeMonth')}
              >
                <span className="inline-flex items-center gap-1">
                  近3月 <SortIcon column="threeMonth" />
                </span>
              </th>}
              {activeTab === 'today' && <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors hidden lg:table-cell"
                onClick={() => toggleSort('sixMonth')}
              >
                <span className="inline-flex items-center gap-1">
                  近6月 <SortIcon column="sixMonth" />
                </span>
              </th>}
              {activeTab === 'today' && <th
                className="text-right p-3 text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors hidden xl:table-cell"
                onClick={() => toggleSort('oneYear')}
              >
                <span className="inline-flex items-center gap-1">
                  近1年 <SortIcon column="oneYear" />
                </span>
              </th>}

            </tr>
          </thead>
          <tbody>
            {sorted.map((fund, i) => (
              <tr
                key={fund.code}
                className={cn(
                  'border-t border-border/50 transition-colors hover:bg-secondary/30 cursor-pointer',
                  i % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                )}
                onClick={() => onSelectFund?.(fund)}
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
                  <div className="font-medium">{fund.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {fund.code}{activeTab === 'yesterday' && fund.navDate ? ` · ${fund.navDate}` : ''}
                  </div>
                </td>
                <td className="text-left p-3 text-muted-foreground hidden sm:table-cell">
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    {fund.type}
                  </span>
                </td>
                <td className="text-right p-3 tabular-nums font-medium">
                  {fund.nav.toFixed(4)}
                </td>
                <td className="text-right p-3">{renderChange(fund.dayChange)}</td>
                {activeTab === 'today' && <td className="text-right p-3 hidden md:table-cell">
                  {renderChange(fund.weekChange)}
                </td>}
                {activeTab === 'today' && <td className="text-right p-3 hidden md:table-cell">
                  {renderChange(fund.monthChange)}
                </td>}
                {activeTab === 'today' && <td className="text-right p-3 hidden lg:table-cell">
                  {renderChange(fund.threeMonth)}
                </td>}
                {activeTab === 'today' && <td className="text-right p-3 hidden lg:table-cell">
                  {renderChange(fund.sixMonth)}
                </td>}
                {activeTab === 'today' && <td className="text-right p-3 hidden xl:table-cell">
                  {renderChange(fund.oneYear)}
                </td>}

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
