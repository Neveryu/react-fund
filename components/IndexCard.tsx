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
        'flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all',
        onClick && 'cursor-pointer hover:bg-secondary/50',
        isPositive ? 'text-success' : 'text-destructive'
      )}
      title={`${data.name} ${data.code}\n${data.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}\n${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%`}
    >
      <span className="text-sm leading-tight">{data.flag}</span>
      <span className="text-[11px] font-medium whitespace-nowrap">{data.name}</span>
      <span className="text-[11px] font-bold tabular-nums">
        {data.value.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
      </span>
      <span className={cn(
        'text-[10px] font-semibold tabular-nums px-1 py-0.5 rounded',
        isPositive ? 'bg-success/10' : 'bg-destructive/10'
      )}>
        {isPositive ? '+' : ''}{data.changePercent.toFixed(1)}%
      </span>
    </div>
  )
}