'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, ArrowDownRight, ArrowUpRight, Globe2, Sparkles } from 'lucide-react'
import { buildMarketSummary } from '@/lib/ai-daily-analysis'
import type { DailyAiAnalysis, DailyAnalysisData, IndexData } from '@/lib/data'
import MarketOverview from './MarketOverview'
import SectorRankingTable from './SectorRankingTable'
import CapitalFlowTable from './CapitalFlowTable'
import TurnoverComparison from './TurnoverComparison'
import SectorAnalysis from './SectorAnalysis'

type Tab = 'industry' | 'concept' | 'capital' | 'analysis'

function InsightStat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint: string
  tone: 'up' | 'down' | 'neutral'
}) {
  const toneClass =
    tone === 'up'
      ? 'bg-success/10 text-success'
      : tone === 'down'
        ? 'bg-destructive/10 text-destructive'
        : 'bg-secondary text-foreground'

  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Activity

  return (
    <div className="rounded-lg border border-border/50 bg-background/60 p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-md shrink-0', toneClass)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="text-base sm:text-lg font-bold leading-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  )
}

export default function DailyMarketAnalysis({
  data,
  indices,
  aiAnalysis,
  isAiLoading,
}: {
  data: DailyAnalysisData
  indices: IndexData[]
  aiAnalysis: DailyAiAnalysis | null
  isAiLoading: boolean
}) {
  const [tab, setTab] = useState<Tab>('industry')
  const summary = buildMarketSummary(data, indices)

  const sentimentClass =
    aiAnalysis?.sentiment === 'bullish'
      ? 'bg-success/10 text-success'
      : aiAnalysis?.sentiment === 'bearish'
        ? 'bg-destructive/10 text-destructive'
        : 'bg-secondary text-foreground'

  const tabs: { key: Tab; label: string }[] = [
    { key: 'analysis', label: '板块分析' },
    { key: 'industry', label: '行业板块' },
    { key: 'concept', label: '概念板块' },
    { key: 'capital', label: '资金流向' },
  ]

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-5 flex flex-col gap-5">
          {/* AI 分析文字区域 */}
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-sm text-primary">
              <Globe2 className="h-4 w-4" />
              <span className="font-medium">AI 当日分析</span>
              <Sparkles className="h-4 w-4" />
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                  aiAnalysis?.source === 'ai' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                )}
              >
                {aiAnalysis?.source === 'ai'
                  ? `AI生成${aiAnalysis.provider ? ` · ${aiAnalysis.provider}` : ''}`
                  : '规则生成'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold tracking-tight">
                {aiAnalysis?.title || summary.headline}
              </h3>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                  sentimentClass
                )}
              >
                {aiAnalysis?.sentiment === 'bullish'
                  ? '偏强'
                  : aiAnalysis?.sentiment === 'bearish'
                    ? '承压'
                    : '中性'}
              </span>
            </div>
            <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
              {isAiLoading ? (
                <p>正在生成 AI 盘面解读...</p>
              ) : (
                <>
                  <p>{aiAnalysis?.summary || summary.summaryLines.join(' ')}</p>
                  {aiAnalysis?.bullets && aiAnalysis.bullets.length > 0 ? (
                    <div className="space-y-2">
                      {aiAnalysis.bullets.map((line) => (
                        <p key={line}>- {line}</p>
                      ))}
                    </div>
                  ) : (
                    summary.summaryLines.slice(1).map((line) => <p key={line}>{line}</p>)
                  )}
                </>
              )}
            </div>
          </div>

          {/* 4个统计卡片：移动端2列，PC端4列 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.stats.map((item) => (
              <InsightStat
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
                tone={item.tone}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <MarketOverview data={data.marketStats} />

      {/* 两市成交额对比 */}
      <TurnoverComparison data={data.turnoverTrend} />

      <div className="space-y-4">
        <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-1.5 transition-colors',
                tab === t.key
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'analysis' && (
          <SectorAnalysis
            industrySectors={data.industrySectors}
            conceptSectors={data.conceptSectors}
            capitalFlow={data.capitalFlow}
          />
        )}
        {tab === 'industry' && (
          <SectorRankingTable data={data.industrySectors} title="行业板块" />
        )}
        {tab === 'concept' && (
          <SectorRankingTable data={data.conceptSectors} title="概念板块" />
        )}
        {tab === 'capital' && <CapitalFlowTable data={data.capitalFlow} />}
      </div>
    </div>
  )
}
