import { cn } from '@/lib/utils'
import MiniChart from '@/components/MiniChart'
import type { IndexData } from '@/lib/data'

export default function IndexCard({
  data,
  onClick,
}: {
  data: IndexData
  onClick?: (data: IndexData) => void
}) {
  const isPositive = data.changePercent >= 0

  return (
    <div
      onClick={() => onClick?.(data)}
      className={cn(
        'flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-secondary/50',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0 leading-tight">{data.flag}</span>
        <div className="min-w-0">
          <h3 className="text-xs font-medium truncate">{data.name}</h3>
          <p className="text-[10px] text-muted-foreground">{data.code}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="text-right">
          <p className="text-xs sm:text-sm font-bold tabular-nums">{data.value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className={cn('text-[10px] tabular-nums', isPositive ? 'text-success' : 'text-destructive')}>
            {isPositive ? '+' : ''}{data.change.toFixed(2)}
          </p>
        </div>
        <span
          className={cn(
            'text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded',
            isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}
        >
          {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
        </span>
        <div className="w-24 h-10 opacity-70 hidden sm:block">
          {data.sparkline && data.sparkline.length >= 2 && (
            <MiniChart data={data.sparkline} positive={isPositive} id={data.code} width={96} height={40} />
          )}
        </div>
      </div>
    </div>
  )
}
