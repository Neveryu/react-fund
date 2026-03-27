import { Card, CardContent } from '@/components/ui/card'
import MiniChart from '@/components/MiniChart'
import { cn } from '@/lib/utils'
import type { IndexData } from '@/lib/data'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function IndexCard({ data }: { data: IndexData }) {
  const isPositive = data.changePercent >= 0

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:shadow-card',
        isPositive ? 'hover:shadow-glow-success' : 'hover:shadow-glow-destructive'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">{data.flag}</span>
              <h3 className="text-sm font-medium">{data.name}</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{data.code}</p>
          </div>
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full',
              isPositive
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {isPositive ? '+' : ''}
            {data.changePercent.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {data.value.toLocaleString('zh-CN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p
              className={cn(
                'text-xs tabular-nums mt-0.5',
                isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {isPositive ? '+' : ''}
              {data.change.toFixed(2)}
            </p>
          </div>
          <div className="opacity-70 group-hover:opacity-100 transition-opacity">
            {data.sparkline && data.sparkline.length >= 2 && (
              <MiniChart data={data.sparkline} positive={isPositive} id={data.code} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
