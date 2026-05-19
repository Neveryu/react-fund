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
        'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all shrink-0',
        onClick && 'cursor-pointer hover:scale-105',
        isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
      )}
      title={`${data.name} ${data.code}\n${data.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}\n${isPositive ? '+' : ''}${data.changePercent.toFixed(2)}%`}
    >
      <span className="text-base leading-tight">{data.flag}</span>
      <span className="text-[11px] font-medium">{data.name}</span>
      <span className="text-[11px] font-bold tabular-nums">
        {data.value.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
      </span>
      <span className="text-[10px] font-semibold tabular-nums">
        {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
      </span>
    </div>
  )
}