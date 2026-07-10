'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { SectorData } from '@/lib/data'
import { ArrowUpDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

type SortKey = 'changePercent'

export default function SectorRankingTable({ data, title }: { data: SectorData[]; title: string }) {
  const [sortDesc, setSortDesc] = useState(true)

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">暂无{title}数据</p>
      </div>
    )
  }

  const sorted = [...data].sort((a, b) =>
    sortDesc ? b.changePercent - a.changePercent : a.changePercent - b.changePercent
  )

  const toggleSort = () => setSortDesc(!sortDesc)

  const SortIcon = () => {
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
    <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden shadow-sm">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm md:table-fixed">
          <thead>
            <tr className="h-9 bg-secondary/40 border-b border-border/50">
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium w-14">排名</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium md:w-[28%]">板块名称</th>
              <th
                className="text-right px-3 py-2 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors whitespace-nowrap md:w-[18%]"
                onClick={toggleSort}
              >
                <span className="inline-flex items-center gap-1">
                  涨跌幅 <SortIcon />
                </span>
              </th>
              <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium hidden md:table-cell whitespace-nowrap md:w-[22%]">
                涨/跌家数
              </th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium hidden sm:table-cell">
                领涨股
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((sector, i) => (
              <tr
                key={sector.code}
                className={cn(
                  'h-11 border-t border-border/40 transition-colors hover:bg-secondary/30',
                  i % 2 === 0 ? 'bg-transparent' : 'bg-secondary/10'
                )}
              >
                <td className="px-3 py-2">
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
                <td className="px-3 py-2">
                  <div className="font-medium truncate">{sector.name}</div>
                </td>
                <td className="text-right px-3 py-2 whitespace-nowrap">{renderChange(sector.changePercent)}</td>
                <td className="text-right px-3 py-2 hidden md:table-cell whitespace-nowrap">
                  <span className="text-success tabular-nums">↑{sector.advancers}</span>
                  <span className="text-muted-foreground mx-1">/</span>
                  <span className="text-destructive tabular-nums">↓{sector.decliners}</span>
                </td>
                <td className="px-3 py-2 hidden sm:table-cell">
                  <span className="block truncate text-xs text-muted-foreground">{sector.leadStock}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
