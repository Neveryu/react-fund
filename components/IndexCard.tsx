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
        'flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg transition-all hover:scale-105',
        onClick && 'cursor-pointer',
        isPositive ? 'bg-success/5 hover:bg-success/10' : 'bg-destructive/5 hover:bg-destructive/10'
      )}
      title={`${data.name} ${data.code}`}
    >
      <span className="text-base sm:text-lg leading-tight">{data.flag}</span>
      <h3 className="text-[10px] sm:text-xs font-medium text-center line-clamp-1 max-w-[80px]">
        {data.name}
      </h3>
      <p className="text-[11px] sm:text-xs font-bold tabular-nums">
        {data.value.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
      </p>
      <span
        className={cn(
          'text-[10px] sm:text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded',
          isPositive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
        )}
      >
        {isPositive ? '+' : ''}{data.changePercent.toFixed(2)}%
      </span>
      <div className="w-16 h-8 opacity-60">
        {data.sparkline && data.sparkline.length >= 2 && (
          <MiniChart data={data.sparkline} positive={isPositive} id={data.code} width={64} height={32} />
        )}
      </div>
    </div>
  )
}