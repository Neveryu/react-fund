'use client'

import { cn } from '@/lib/utils'
import type { SectorData, SectorCapitalFlowData } from '@/lib/data'
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react'

interface SectorAnalysisProps {
  industrySectors: SectorData[]
  conceptSectors: SectorData[]
  capitalFlow: SectorCapitalFlowData[]
}

export default function SectorAnalysis({ industrySectors, conceptSectors, capitalFlow }: SectorAnalysisProps) {
  if (industrySectors.length === 0 && conceptSectors.length === 0 && capitalFlow.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center rounded-lg border border-dashed border-border">
        <p className="text-sm text-muted-foreground">暂无板块分析数据</p>
      </div>
    )
  }

  const topIndustries = [...industrySectors].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5)
  const bottomIndustries = [...industrySectors].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3)
  const topConcepts = [...conceptSectors].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5)
  const topCapitalInflow = [...capitalFlow].sort((a, b) => b.mainNetInflow - a.mainNetInflow).slice(0, 3)
  const topCapitalOutflow = [...capitalFlow].sort((a, b) => a.mainNetInflow - b.mainNetInflow).slice(0, 2)

  const formatTurnover = (value: number): string => {
    if (Math.abs(value) >= 1e12) {
      return `${(value / 1e12).toFixed(2)}万亿`
    } else if (Math.abs(value) >= 1e8) {
      return `${(value / 1e8).toFixed(2)}亿`
    }
    return `${value.toFixed(0)}元`
  }

  const renderChangePercent = (value: number) => {
    const isPositive = value >= 0
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 font-medium tabular-nums text-sm',
          isPositive ? 'text-success' : 'text-destructive'
        )}
      >
        {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {isPositive ? '+' : ''}
        {value.toFixed(2)}%
      </span>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {/* 行业板块领涨榜 */}
      <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden shadow-sm">
        <div className="h-10 px-3.5 bg-secondary/40 flex items-center gap-2 border-b border-border/40">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">行业板块领涨榜</h3>
        </div>
        <div className="divide-y divide-border/50">
          {topIndustries.map((sector, i) => (
            <div key={sector.code} className="flex min-h-12 items-center justify-between px-3.5 py-2 hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={cn(
                  'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shrink-0',
                  i === 0 ? 'bg-red-500/20 text-red-500' : i === 1 ? 'bg-orange-500/20 text-orange-500' : 'bg-secondary text-muted-foreground'
                )}>
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{sector.name}</div>
                  <div className="text-xs text-muted-foreground">
                    涨 <span className="text-success">{sector.advancers}</span> / 跌 <span className="text-destructive">{sector.decliners}</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                {renderChangePercent(sector.changePercent)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 概念板块领涨榜 */}
      {conceptSectors.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden shadow-sm">
          <div className="h-10 px-3.5 bg-secondary/40 flex items-center gap-2 border-b border-border/40">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">概念板块领涨榜</h3>
          </div>
          <div className="divide-y divide-border/50">
            {topConcepts.map((sector, i) => (
              <div key={sector.code} className="flex min-h-12 items-center justify-between px-3.5 py-2 hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={cn(
                    'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold shrink-0',
                    i === 0 ? 'bg-red-500/20 text-red-500' : i === 1 ? 'bg-orange-500/20 text-orange-500' : 'bg-secondary text-muted-foreground'
                  )}>
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{sector.name}</div>
                    {sector.leadStock && (
                      <div className="text-xs text-muted-foreground">领涨: {sector.leadStock}</div>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  {renderChangePercent(sector.changePercent)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 资金流向分析 */}
      <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden shadow-sm">
        <div className="h-10 px-3.5 bg-secondary/40 flex items-center gap-2 border-b border-border/40">
          <DollarSign className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">主力资金流向</h3>
        </div>
        
        {/* 净流入前5 */}
        <div className="border-b border-border/50">
          <div className="px-3.5 py-1.5 text-xs font-medium text-success bg-success/5">净流入板块</div>
          <div className="divide-y divide-border/50">
            {topCapitalInflow.map((flow) => (
              <div key={flow.code} className="flex min-h-12 items-center justify-between px-3.5 py-2 hover:bg-secondary/20 transition-colors">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{flow.name}</div>
                  <div className="text-xs text-muted-foreground">
                    涨幅 {renderChangePercent(flow.changePercent)}
                  </div>
                </div>
                <div className="shrink-0 text-success text-sm font-medium">
                  +{formatTurnover(flow.mainNetInflow)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 净流出前3 */}
        {topCapitalOutflow.length > 0 && (
          <div>
            <div className="px-3.5 py-1.5 text-xs font-medium text-destructive bg-destructive/5">净流出板块</div>
            <div className="divide-y divide-border/50">
              {topCapitalOutflow.map((flow) => (
                <div key={flow.code} className="flex min-h-12 items-center justify-between px-3.5 py-2 hover:bg-secondary/20 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{flow.name}</div>
                    <div className="text-xs text-muted-foreground">
                      涨幅 {renderChangePercent(flow.changePercent)}
                    </div>
                  </div>
                  <div className="shrink-0 text-destructive text-sm font-medium">
                    -{formatTurnover(Math.abs(flow.mainNetInflow))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 板块分析总结 */}
      {(topIndustries.length > 0 || topCapitalInflow.length > 0) && (
        <div className="rounded-xl border border-border/60 bg-background/60 p-4 xl:col-span-3">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            板块分析总结
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
            {topIndustries.length > 0 && (
              <p>
                <strong className="text-foreground">行业热点：</strong>
                {topIndustries[0].name}领涨市场，涨幅{topIndustries[0].changePercent >= 0 ? '+' : ''}{topIndustries[0].changePercent.toFixed(2)}%，
                板块内上涨家数{topIndustries[0].advancers}家，下跌{topIndustries[0].decliners}家。
                {topIndustries.length > 2 && (
                  <> 紧随其后的是{topIndustries[1].name}和{topIndustries[2].name}，涨幅分别为{topIndustries[1].changePercent >= 0 ? '+' : ''}{topIndustries[1].changePercent.toFixed(2)}%和{topIndustries[2].changePercent >= 0 ? '+' : ''}{topIndustries[2].changePercent.toFixed(2)}%。</>
                )}
              </p>
            )}
            {topConcepts.length > 0 && (
              <p>
                <strong className="text-foreground">概念题材：</strong>
                {topConcepts[0].name}概念表现活跃，涨幅{topConcepts[0].changePercent >= 0 ? '+' : ''}{topConcepts[0].changePercent.toFixed(2)}%。
                {topConcepts[0].leadStock && (
                  <> 领涨股为{topConcepts[0].leadStock}。</>
                )}
              </p>
            )}
            {topCapitalInflow.length > 0 && (
              <p>
                <strong className="text-foreground">资金动向：</strong>
                主力资金主要流向{topCapitalInflow[0].name}，净流入约{formatTurnover(topCapitalInflow[0].mainNetInflow)}。
                {topCapitalOutflow.length > 0 && (
                  <> 而{topCapitalOutflow[0].name}则遭遇资金流出，净流出约{formatTurnover(Math.abs(topCapitalOutflow[0].mainNetInflow))}。</>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
