import { cn } from '@/lib/utils'
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
        'flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all shrink-0 min-w-[80px]',
        'border border-border/30 shadow-sm hover:shadow-md',
        onClick && 'cursor-pointer hover:scale-105 hover:border-opacity-50',
        isPositive 
          ? 'bg-gradient-to-br from-success/5 to-success/10 border-success/20 hover:from-success/10 hover:to-success/15' 
          : 'bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20 hover:from-destructive/10 hover:to-destructive/15'
      )}
      title={`${data.name} ${data.code}\n${data.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}\n${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%`}
    >
      <span className="text-lg leading-tight">{data.flag}</span>
      <span className="text-xs font-medium text-muted-foreground">{data.name}</span>
      <span className={cn(
        'text-sm font-bold tabular-nums',
        isPositive ? 'text-success' : 'text-destructive'
      )}>
        {data.value.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
      </span>
      <span className={cn(
        'text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full',
        isPositive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
      )}>
        {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
      </span>
    </div>
  )
}