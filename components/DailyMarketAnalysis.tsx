'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { DailyAnalysisData } from '@/lib/data'
import MarketOverview from './MarketOverview'
import SectorRankingTable from './SectorRankingTable'
import CapitalFlowTable from './CapitalFlowTable'
import TurnoverComparison from './TurnoverComparison'

type Tab = 'industry' | 'concept' | 'capital'

export default function DailyMarketAnalysis({ data }: { data: DailyAnalysisData }) {
  const [tab, setTab] = useState<Tab>('industry')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'industry', label: '行业板块' },
    { key: 'concept', label: '概念板块' },
    { key: 'capital', label: '资金流向' },
  ]

  return (
    <div className="space-y-6">
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
