// A 股市场交易时段计算（基于北京时间 Asia/Shanghai，UTC+8 固定偏移、无夏令时）
// 注意：仅按「周一至周五 + 时段」判断，不含法定节假日调休，节假日休市可能与实际不符。

export type MarketSessionKey = 'preopen' | 'open' | 'lunch' | 'closed' | 'weekend'

export interface MarketSessionInfo {
  key: MarketSessionKey
  /** 中文状态标签 */
  label: string
  /** 是否处于连续竞价交易时段 */
  live: boolean
  /** 是否为交易日（周一至周五，未考虑节假日） */
  isTradingDay: boolean
  /** 下一节点描述，如「距收盘」「距下一交易日开盘」 */
  nextLabel: string
  /** 下一个状态切换的绝对时间戳（毫秒） */
  nextAt: number
}

const CN_OFFSET = 8 * 3600 * 1000
const DAY = 86400000

/**
 * 计算当前（或给定时刻）的 A 股交易时段状态。
 */
export function getMarketSession(d: Date = new Date()): MarketSessionInfo {
  const t = d.getTime() + CN_OFFSET
  const dayStart = Math.floor(t / DAY) * DAY
  const days = dayStart / DAY
  const weekday = (days + 4) % 7 // 0=周日, 1=周一 ... 6=周六
  const isWeekend = weekday === 0 || weekday === 6

  // 以北京时间「当日墙钟」构造某个绝对时刻（返回真实 epoch 毫秒）
  const at = (hh: number, mm: number, dayOffset = 0) =>
    dayStart + dayOffset * DAY + (hh * 3600 + mm * 60) * 1000 - CN_OFFSET

  const now = d.getTime()

  // 距下一个交易日开盘的天数偏移（跳过周末）
  const toNextTradingDay = weekday === 5 ? 3 : weekday === 6 ? 2 : 1

  if (isWeekend) {
    const offset = weekday === 6 ? 2 : 1 // 周六→+2 周一, 周日→+1 周一
    return {
      key: 'weekend',
      label: '周末休市',
      live: false,
      isTradingDay: false,
      nextLabel: '距下一交易日开盘',
      nextAt: at(9, 30, offset),
    }
  }

  if (now < at(9, 15)) {
    return { key: 'closed', label: '未开盘', live: false, isTradingDay: true, nextLabel: '距开盘', nextAt: at(9, 30) }
  }
  if (now < at(9, 30)) {
    return { key: 'preopen', label: '集合竞价', live: false, isTradingDay: true, nextLabel: '距开盘', nextAt: at(9, 30) }
  }
  if (now < at(11, 30)) {
    return { key: 'open', label: '交易中', live: true, isTradingDay: true, nextLabel: '距午间休市', nextAt: at(11, 30) }
  }
  if (now < at(13, 0)) {
    return { key: 'lunch', label: '午间休市', live: false, isTradingDay: true, nextLabel: '距下午开盘', nextAt: at(13, 0) }
  }
  if (now < at(15, 0)) {
    return { key: 'open', label: '交易中', live: true, isTradingDay: true, nextLabel: '距收盘', nextAt: at(15, 0) }
  }
  return {
    key: 'closed',
    label: '已收盘',
    live: false,
    isTradingDay: true,
    nextLabel: '距下一交易日开盘',
    nextAt: at(9, 30, toNextTradingDay),
  }
}

/** 将剩余毫秒格式化为「[D天] HH:MM:SS」 */
export function formatCountdown(ms: number): string {
  let total = Math.max(0, Math.floor(ms / 1000))
  const day = Math.floor(total / 86400)
  total -= day * 86400
  const h = Math.floor(total / 3600)
  total -= h * 3600
  const m = Math.floor(total / 60)
  const s = total % 60
  const p = (n: number) => String(n).padStart(2, '0')
  if (day > 0) return `${day}天 ${p(h)}:${p(m)}:${p(s)}`
  if (h > 0) return `${p(h)}:${p(m)}:${p(s)}`
  return `${p(m)}:${p(s)}`
}
