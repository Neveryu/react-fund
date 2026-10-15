import type { DailyIndexBar, TurnoverHistoryIndex, TurnoverHistoryPoint } from './data'

export const TURNOVER_HISTORY_INDICES: Record<TurnoverHistoryIndex, { name: string; secid: string }> = {
  sh: { name: '上证指数', secid: '1.000001' },
  sz: { name: '深证成指', secid: '0.399001' },
  cyb: { name: '创业板指', secid: '0.399006' },
}

export const TURNOVER_HISTORY_TTL = 5 * 60_000

/** 东财日 K：日期、开、收、高、低、成交量、成交额。成交量不能当作成交额。 */
export function parseDailyIndexBars(lines: unknown[]): DailyIndexBar[] {
  const byDate = new Map<string, DailyIndexBar>()
  for (const line of lines) {
    if (typeof line !== 'string') continue
    const [date, openText, closeText, highText, lowText, , turnoverText] = line.split(',')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
    const parsedDate = new Date(`${date}T00:00:00Z`)
    if (!Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) continue
    const [open, close, high, low] = [openText, closeText, highText, lowText].map(Number)
    if (![open, close, high, low].every((value) => Number.isFinite(value) && value > 0)) continue
    if (low > Math.min(open, close) || high < Math.max(open, close)) continue
    const amount = Number(turnoverText)
    byDate.set(date, {
      date, open, close, high, low,
      turnover: turnoverText?.trim() && Number.isFinite(amount) && amount >= 0 ? amount : null,
    })
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/** 按交易日期对齐；任一市场缺数则保留空值，图表据此断线。 */
export function mergeTurnoverHistory(
  indexBars: DailyIndexBar[],
  shBars: DailyIndexBar[],
  szBars: DailyIndexBar[],
): TurnoverHistoryPoint[] {
  const sh = new Map(shBars.map((bar) => [bar.date, bar.turnover]))
  const sz = new Map(szBars.map((bar) => [bar.date, bar.turnover]))
  const sorted = [...indexBars].sort((a, b) => a.date.localeCompare(b.date))
  const totals = sorted.map(({ date }) => {
    const shAmount = sh.get(date) ?? null
    const szAmount = sz.get(date) ?? null
    return shAmount !== null && szAmount !== null ? shAmount + szAmount : null
  })
  return sorted.map((bar, i) => {
    const previousClose = sorted[i - 1]?.close
    const previousTotal = totals[i - 1]
    const totalTurnover = totals[i]
    return {
      date: bar.date, open: bar.open, close: bar.close, high: bar.high, low: bar.low,
      indexChangePercent: previousClose > 0 ? (bar.close / previousClose - 1) * 100 : null,
      shTurnover: sh.get(bar.date) ?? null,
      szTurnover: sz.get(bar.date) ?? null,
      totalTurnover,
      turnoverChangePercent: totalTurnover !== null && previousTotal != null && previousTotal > 0
        ? (totalTurnover / previousTotal - 1) * 100 : null,
    }
  })
}
