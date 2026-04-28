'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FundRankingData } from '@/lib/data'

interface FundDetailModalProps {
  fund: FundRankingData | null
  onClose: () => void
  isLoading?: boolean
}

export default function FundDetailModal({ fund, onClose, isLoading }: FundDetailModalProps) {
  if (!fund) return null

  const isPositive = (value: number) => value >= 0

  // 检查是否有详细信息
  const hasDetail = fund.manager || fund.scale || (fund.holdings && fund.holdings.length > 0)

  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">{fund.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{fund.code} · {fund.type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* 基本信息 */}
        <div className="px-5 py-3 bg-secondary/20 border-b border-border">
          <div className="flex items-center gap-6 text-sm">
            {isLoading && !hasDetail ? (
              <div className="text-muted-foreground">正在加载基金详情...</div>
            ) : (
              <>
                {fund.manager ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">基金经理:</span>
                    <span className="font-medium">{fund.manager}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">基金经理:</span>
                    <span className="text-muted-foreground">暂无</span>
                  </div>
                )}
                {fund.scale ? (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">基金规模:</span>
                    <span className="font-medium">{fund.scale}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">基金规模:</span>
                    <span className="text-muted-foreground">暂无</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* 净值和日涨跌幅 */}
          <div className="flex items-end gap-6">
            <div>
              <p className="text-sm text-muted-foreground">单位净值</p>
              <p className="text-3xl font-bold tabular-nums">{fund.nav.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground mt-1">日期: {fund.navDate}</p>
            </div>
            <div className="pb-1">
              <span
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  isPositive(fund.dayChange) ? 'text-success' : 'text-destructive'
                )}
              >
                {formatChange(fund.dayChange)}
              </span>
              <p className="text-sm text-muted-foreground">日涨跌幅</p>
            </div>
          </div>

          {/* 收益概览 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">收益概览</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">近1周</p>
                <p
                  className={cn(
                    'font-semibold tabular-nums',
                    isPositive(fund.weekChange) ? 'text-success' : 'text-destructive'
                  )}
                >
                  {formatChange(fund.weekChange)}
                </p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">近1月</p>
                <p
                  className={cn(
                    'font-semibold tabular-nums',
                    isPositive(fund.monthChange) ? 'text-success' : 'text-destructive'
                  )}
                >
                  {formatChange(fund.monthChange)}
                </p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">近3月</p>
                <p
                  className={cn(
                    'font-semibold tabular-nums',
                    isPositive(fund.threeMonth) ? 'text-success' : 'text-destructive'
                  )}
                >
                  {formatChange(fund.threeMonth)}
                </p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">近6月</p>
                <p
                  className={cn(
                    'font-semibold tabular-nums',
                    isPositive(fund.sixMonth) ? 'text-success' : 'text-destructive'
                  )}
                >
                  {formatChange(fund.sixMonth)}
                </p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">近1年</p>
                <p
                  className={cn(
                    'font-semibold tabular-nums',
                    isPositive(fund.oneYear) ? 'text-success' : 'text-destructive'
                  )}
                >
                  {formatChange(fund.oneYear)}
                </p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">近2年</p>
                <p
                  className={cn(
                    'font-semibold tabular-nums',
                    isPositive(fund.twoYear) ? 'text-success' : 'text-destructive'
                  )}
                >
                  {formatChange(fund.twoYear)}
                </p>
              </div>
            </div>
          </div>

          {/* 持仓情况 */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">前十大持仓</h3>
            {isLoading && !fund.holdings ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 bg-muted rounded" />
                      <div>
                        <div className="h-4 w-20 bg-muted rounded mb-1" />
                        <div className="h-3 w-12 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 w-12 bg-muted rounded mb-1" />
                      <div className="h-3 w-8 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : fund.holdings && fund.holdings.length > 0 ? (
              <div className="space-y-2">
                {fund.holdings.slice(0, 5).map((holding, index) => (
                  <div
                    key={holding.code}
                    className="flex items-center justify-between py-2 px-3 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5">{index + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{holding.name}</p>
                        <p className="text-xs text-muted-foreground">{holding.code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{holding.percent.toFixed(2)}%</p>
                      <p className="text-xs text-muted-foreground">持仓占比</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">暂无持仓数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
