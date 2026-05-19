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
        'flex items-center justify-between px-2 py-1 rounded transition-all',
        onClick && 'cursor-pointer hover:bg-secondary/30'
      )}
      title={`${data.name} ${data.code}\n${data.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}\n${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs leading-tight">{data.flag}</span>
        <span className="text-[11px] text-muted-foreground">{data.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium tabular-nums text-foreground">
          {data.value.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
        </span>
        <span className={cn(
          'text-[10px] font-semibold tabular-nums px-1.5 py-0.25 rounded',
          isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
        )}>
          {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}