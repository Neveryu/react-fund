import type { IndexData, StockData, FundData, FundRankingData, MarketStatsData, SectorData, SectorCapitalFlowData, DailyAnalysisData, TurnoverTrendData, TurnoverTrendPoint, DailyAiAnalysis, HeatmapSector, HeatmapStock } from './data'
import { buildRuleBasedAiAnalysis, buildAiUserPrompt, parseAiAnalysis } from './ai-daily-analysis'
import { getAiConfig, hasAiConfig } from './ai-config'

/* ── JSONP Utility ─────────────────────────────── */

function jsonp<T>(url: string, callbackParam = 'cb'): Promise<T> {
  return new Promise((resolve, reject) => {
    const name = `_jp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const script = document.createElement('script')
    let timer: ReturnType<typeof setTimeout>

    const cleanup = () => {
      clearTimeout(timer)
      delete (window as any)[name]
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    ;(window as any)[name] = (data: T) => {
      resolve(data)
      cleanup()
    }

    const sep = url.includes('?') ? '&' : '?'
    script.src = `${url}${sep}${callbackParam}=${name}`
    script.onerror = () => {
      reject(new Error('JSONP failed'))
      cleanup()
    }

    timer = setTimeout(() => {
      reject(new Error('JSONP timeout'))
      cleanup()
    }, 10000)

    document.head.appendChild(script)
  })
}

/* ── Helpers ───────────────────────────────── */

function inferFundType(name: string): string {
  if (name.includes('混合')) return '混合型'
  if (name.includes('股票')) return '股票型'
  if (name.includes('债券')) return '债券型'
  if (name.includes('指数') || name.includes('ETF联接')) return '指数型'
  if (name.includes('QDII')) return 'QDII'
  if (name.includes('FOF')) return 'FOF'
  if (name.includes('货币')) return '货币型'
  return '其他'
}

/** Load a script tag and resolve with the value of a global variable set by it. */
function loadScriptVar<T>(src: string, varName: string, timeout = 8000): Promise<T | null> {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    let done = false

    const cleanup = () => {
      done = true
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    script.onload = () => {
      if (done) return
      const val = (window as any)[varName]
      resolve(val ?? null)
      cleanup()
    }

    script.onerror = () => {
      if (!done) resolve(null)
      cleanup()
    }

    script.src = src
    document.head.appendChild(script)

    setTimeout(() => {
      if (!done) {
        resolve(null)
        cleanup()
      }
    }, timeout)
  })
}

/* ── Kline ──────────────────────────────────── */

interface KlineRaw {
  date: string
  open: number
  close: number
  high: number
  low: number
  volume: number
  change: number
  changePercent: number
}

const KLT_CODE: Record<string, string> = {
  day: '101',
  week: '102',
  month: '103',
}

export async function fetchKline(
  secid: string,
  klt: string = 'day',
  lmt: number = 120
): Promise<{ name: string; code: string; klines: KlineRaw[] } | null> {
  try {
    const kltCode = KLT_CODE[klt] || '101'
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&klt=${kltCode}&fqt=1&lmt=${lmt}&end=20500101&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56,f57,f58`
    const data = await jsonp<any>(url, 'callback')
    if (!data.data?.klines?.length) return null
    const klines = data.data.klines.map((line: string) => {
      const p = line.split(',')
      const open = parseFloat(p[1])
      const close = parseFloat(p[2])
      const change = close - open
      const changePercent = open ? (change / open) * 100 : 0
      return {
        date: p[0],
        open,
        close,
        high: parseFloat(p[3]),
        low: parseFloat(p[4]),
        volume: parseFloat(p[5]),
        change,
        changePercent,
      }
    })
    return { name: data.data.name || '', code: secid, klines }
  } catch {
    return null
  }
}

/* ── Indices ───────────────────────────────────── */

export const INDEX_META: Record<string, { flag: string; market: string; secid: string }> = {
  '000001': { flag: '\uD83C\uDDE8\uD83C\uDDF3', market: 'CN', secid: '1.000001' },
  '399001': { flag: '\uD83C\uDDE8\uD83C\uDDF3', market: 'CN', secid: '0.399001' },
  '399006': { flag: '\uD83C\uDDE8\uD83C\uDDF3', market: 'CN', secid: '0.399006' },
  HSI: { flag: '\uD83C\uDDED\uD83C\uDDF0', market: 'HK', secid: '100.HSI' },
  NDX: { flag: '\uD83C\uDDFA\uD83C\uDDF8', market: 'US', secid: '100.NDX' },
  SPX: { flag: '\uD83C\uDDFA\uD83C\uDDF8', market: 'US', secid: '100.SPX' },
  N225: { flag: '\uD83C\uDDEF\uD83C\uDDF5', market: 'JP', secid: '100.N225' },
  FTSE: { flag: '\uD83C\uDDEC\uD83C\uDDE7', market: 'EU', secid: '100.FTSE' },
  KS11: { flag: '\uD83C\uDDF0\uD83C\uDDF7', market: 'KR', secid: '100.KS11' },
}

const SECIDS = Object.values(INDEX_META).map((m) => m.secid)

export async function fetchIndices(options: { includeSparkline?: boolean } = {}): Promise<IndexData[]> {
  try {
    const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=${SECIDS.join(',')}&fields=f1,f2,f3,f4,f12,f13,f14&_=${Date.now()}`
    const data = await jsonp<any>(url, 'cb')

    if (data.rc !== 0 || !data.data?.diff) {
      return []
    }

    const sparklineMap = new Map<string, number[]>()
    if (options.includeSparkline) {
      await Promise.all(
        Object.entries(INDEX_META).map(async ([code, meta]) => {
          try {
            const kUrl = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${meta.secid}&klt=101&fqt=1&lmt=15&end=20500101&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56,f57,f58`
            const kData = await jsonp<any>(kUrl, 'callback')
            if (kData.data?.klines && Array.isArray(kData.data.klines)) {
              sparklineMap.set(
                code,
                kData.data.klines.map((k: string) => parseFloat(k.split(',')[2]))
              )
            }
          } catch {}
        })
      )
    }

    return data.data.diff
      .filter((item: any) => typeof item.f2 === 'number')
      .map((item: any) => {
        const code = String(item.f12)
        const meta = INDEX_META[code]
        return {
          name: item.f14,
          code,
          value: item.f2,
          change: item.f4,
          changePercent: item.f3,
          market: meta?.market || 'OTHER',
          flag: meta?.flag || '🌍',
          sparkline: sparklineMap.get(code) || [],
        }
      })
  } catch (err) {
    console.error('[fetchIndices] Request failed:', err)
    return []
  }
}

/* ── Hot Stocks ────────────────────────────────── */

export async function fetchHotStocks(): Promise<StockData[]> {
  try {
    const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=1&np=1&fltt=2&invt=2&fid=f6&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f2,f3,f4,f5,f6,f12,f14,f15,f16&_=${Date.now()}`
    const data = await jsonp<any>(url, 'cb')

    if (data.rc !== 0 || !data.data?.diff) return []

    return data.data.diff
      .filter((item: any) => typeof item.f2 === 'number' && item.f2 > 0)
      .map((item: any) => {
        const turnover = typeof item.f6 === 'number' ? item.f6 : 0
        let turnoverStr: string
        if (turnover >= 1e8) turnoverStr = (turnover / 1e8).toFixed(1) + '亿'
        else if (turnover >= 1e4) turnoverStr = (turnover / 1e4).toFixed(1) + '万'
        else turnoverStr = String(turnover)

        const volume = typeof item.f5 === 'number' ? item.f5 : 0
        let volumeStr: string
        if (volume >= 1e4) volumeStr = (volume / 1e4).toFixed(1) + '万手'
        else volumeStr = volume + '手'

        return {
          name: item.f14,
          code: String(item.f12),
          price: item.f2,
          change: item.f4,
          changePercent: item.f3,
          volume: volumeStr,
          turnover: turnoverStr,
          high: typeof item.f15 === 'number' ? item.f15 : 0,
          low: typeof item.f16 === 'number' ? item.f16 : 0,
        }
      })
  } catch (err) {
    console.error('fetchHotStocks error:', err)
    return []
  }
}

/* ── Funds ─────────────────────────────────────── */

const FUND_CONFIG = [
  { code: '005827', type: '混合型', manager: '张坤', scale: '576.2亿' },
  { code: '003095', type: '混合型', manager: '葛兰', scale: '234.5亿' },
  { code: '161725', type: '指数型', manager: '侯昊', scale: '456.7亿' },
  { code: '515860', type: 'ETF', manager: '李宁', scale: '89.3亿' },
  { code: '011123', type: '混合型', manager: '杨锐文', scale: '123.4亿' },
  { code: '000051', type: '指数型', manager: '张弘弢', scale: '345.6亿' },
]

interface FundValuationRaw {
  FCODE: string
  SHORTNAME: string
  GSZZL: number | null
  GZTIME: string | null
  GSZ: number | null
  NAV: number | null
  PDATE: string | null
}

interface FundValuationResponse {
  data?: FundValuationRaw[]
  success?: boolean
  errorCode?: number
}

async function fetchFundValuations(codes: string[]): Promise<Map<string, FundValuationRaw>> {
  const params = new URLSearchParams({
    FCODES: codes.join(','),
    FIELDS: 'FCODE,SHORTNAME,GSZZL,GZTIME,GSZ,NAV,PDATE',
  })
  const hosts = ['fundcomapi.tiantianfunds.com', 'fundcomapi.eastmoney.com']
  let lastError: unknown

  for (const host of hosts) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const response = await fetch(`https://${host}/mm/newCore/FundValuationLast?${params}`, {
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const result = await response.json() as FundValuationResponse
      if (result.success === false || result.errorCode !== 0 || !Array.isArray(result.data)) {
        throw new Error('Invalid fund valuation response')
      }
      return new Map(result.data.map((item) => [String(item.FCODE), item]))
    } catch (error) {
      lastError = error
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Fund valuation request failed')
}

let fundHistoryQueue = Promise.resolve()

function fetchFundHistory(
  code: string
): Promise<{ returns: NonNullable<FundData['returns']>; sparkline: number[] } | null> {
  const task = fundHistoryQueue.then(() => fetchFundHistoryUnsafe(code))
  fundHistoryQueue = task.then(() => undefined, () => undefined)
  return task
}

async function fetchFundHistoryUnsafe(
  code: string
): Promise<{ returns: NonNullable<FundData['returns']>; sparkline: number[] } | null> {
  ;(window as any).Data_netWorthTrend = undefined
  ;(window as any).syl_1y = undefined
  ;(window as any).syl_3y = undefined
  ;(window as any).syl_6y = undefined
  ;(window as any).syl_1n = undefined

  await loadScriptVar<any>(
    `https://fund.eastmoney.com/pingzhongdata/${code}.js?v=${Date.now()}`,
    'Data_netWorthTrend',
    8000
  )

  const Data_netWorthTrend = (window as any).Data_netWorthTrend
  const syl_1y = (window as any).syl_1y
  const syl_3y = (window as any).syl_3y
  const syl_6y = (window as any).syl_6y
  const syl_1n = (window as any).syl_1n

  if (!syl_1y && !syl_3y && !syl_6y && !syl_1n) {
    return null
  }

  let oneWeek = 0
  let sparkline: number[] = []

  if (Array.isArray(Data_netWorthTrend)) {
    const navList = Data_netWorthTrend.map((item: any) => item.y)
    const len = navList.length
    if (len >= 6) {
      const cur = navList[len - 1]
      const weekAgo = navList[len - 6]
      oneWeek = weekAgo ? ((cur - weekAgo) / weekAgo) * 100 : 0
    }
    sparkline = navList.slice(-15)
  }

  const returns = {
    oneWeek,
    oneMonth: parseFloat(syl_1y || '0'),
    threeMonth: parseFloat(syl_3y || '0'),
    sixMonth: parseFloat(syl_6y || '0'),
    oneYear: parseFloat(syl_1n || '0'),
  }

  ;(window as any).Data_netWorthTrend = undefined
  ;(window as any).syl_1y = undefined
  ;(window as any).syl_3y = undefined
  ;(window as any).syl_6y = undefined
  ;(window as any).syl_1n = undefined

  return { returns, sparkline }
}

/* ── Search APIs ──────────────────────────────── */

export interface FundSearchResult {
  code: string
  name: string
  type: string
  manager?: string
}

export interface StockSearchResult {
  code: string
  name: string
  market: string
  ticker: string
}

export async function searchFunds(keyword: string): Promise<FundSearchResult[]> {
  if (!keyword.trim()) return []
  try {
    const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(keyword)}&_=${Date.now()}`
    const data = await jsonp<any>(url, 'callback')
    if (!data?.Datas?.length) return []
    return data.Datas.slice(0, 15).map((item: any) => ({
      code: item.CODE,
      name: item.NAME || item.SHORTNAME || item.CODE,
      type: item.FundBaseInfo?.FTYPE?.split('-')[0]?.trim() || '基金',
      manager: item.FundBaseInfo?.JJJL || undefined,
    }))
  } catch {
    return []
  }
}

export async function searchAllStocks(keyword: string): Promise<StockSearchResult[]> {
  if (!keyword.trim()) return []
  try {
    const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(keyword)}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8&count=20`
    const data = await jsonp<any>(url, 'cb')

    if (!data.QuotationCodeTable?.Data) return []

    const MARKET_MAP: Record<string, string> = {
      '0': '深A', '1': '沪A',
      '116': '港股', '128': '港股',
      '105': '美股', '106': '美股', '107': '美股',
      '129': '日股', '130': '日股',
      '131': '韩股', '132': '韩股',
    }

    const results = data.QuotationCodeTable.Data
      .filter((item: any) => item.Code && item.Name && item.QuoteID)
      .map((item: any) => ({
        name: item.Name,
        code: item.QuoteID,
        ticker: item.Code,
        market: MARKET_MAP[String(item.MktNum)] || '其他',
      }))
      .filter((r: StockSearchResult) => r.market !== '其他')

    console.log('[searchAllStocks]', keyword, '→', results.map((r: StockSearchResult) => ({ n: r.name, code: r.code, ticker: r.ticker, m: r.market })))
    return results
  } catch (err) {
    console.error('searchAllStocks error:', err)
    return []
  }
}

export async function searchStocks(keyword: string): Promise<StockSearchResult[]> {
  return searchAllStocks(keyword)
}

/* ── Dynamic Stock Fetch ────────────────────── */

export async function fetchStocksByCodes(codes: string[]): Promise<StockData[]> {
  if (!codes.length) return []
  try {
    const secids = codes.join(',')
    const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=${secids}&fields=f2,f3,f4,f5,f6,f12,f14,f15,f16&_=${Date.now()}`
    const data = await jsonp<any>(url, 'cb')
    if (data.rc !== 0 || !data.data?.diff) return []
    return data.data.diff
      .filter((item: any) => typeof item.f2 === 'number')
      .map((item: any) => {
        const turnover = typeof item.f6 === 'number' ? item.f6 : 0
        let turnoverStr: string
        if (turnover >= 1e8) turnoverStr = (turnover / 1e8).toFixed(1) + '亿'
        else if (turnover >= 1e4) turnoverStr = (turnover / 1e4).toFixed(1) + '万'
        else turnoverStr = String(turnover)
        const volume = typeof item.f5 === 'number' ? item.f5 : 0
        let volumeStr: string
        if (volume >= 1e4) volumeStr = (volume / 1e4).toFixed(1) + '万手'
        else volumeStr = volume + '手'
        return {
          name: item.f14,
          code: String(item.f12),
          price: item.f2,
          change: item.f4,
          changePercent: item.f3,
          volume: volumeStr,
          turnover: turnoverStr,
          high: typeof item.f15 === 'number' ? item.f15 : 0,
          low: typeof item.f16 === 'number' ? item.f16 : 0,
        }
      })
  } catch (err) {
    console.error('fetchStocksByCodes error:', err)
    return []
  }
}

/* ── Dynamic Fund Fetch ─────────────────────── */

export async function fetchFundsByCodes(
  items: { code: string; type: string; manager?: string }[],
  options: { includeHistory?: boolean } = {}
): Promise<FundData[]> {
  if (!items.length) return []

  const codes = items.map((i) => i.code)
  const valuationsPromise = fetchFundValuations(codes)
  const historyPromises = options.includeHistory
    ? codes.map((code) => fetchFundHistory(code))
    : []
  const valuations = await valuationsPromise
  const histories = options.includeHistory ? await Promise.all(historyPromises) : []

  return items
    .map((item, i) => {
      const valuation = valuations.get(item.code)
      if (!valuation || typeof valuation.NAV !== 'number') return null
      return {
        name: valuation.SHORTNAME || item.code,
        code: item.code,
        type: item.type,
        nav: valuation.NAV,
        navDate: valuation.PDATE || '',
        dayChange: typeof valuation.GSZZL === 'number' ? valuation.GSZZL : null,
        estimatedNav: typeof valuation.GSZ === 'number' ? valuation.GSZ : null,
        valuationTime: valuation.GZTIME || null,
        manager: item.manager || undefined,
        scale: undefined,
        returns: histories[i]?.returns,
        sparkline: histories[i]?.sparkline,
      }
    })
    .filter(Boolean) as FundData[]
}

export async function fetchFunds(): Promise<FundData[]> {
  const historyPromises = FUND_CONFIG.map((c) => fetchFundHistory(c.code))
  const valuations = await fetchFundValuations(FUND_CONFIG.map((config) => config.code))
  const histories = await Promise.all(historyPromises)

  return FUND_CONFIG.map((config, i) => {
    const valuation = valuations.get(config.code)
    if (!valuation || typeof valuation.NAV !== 'number') return null
    return {
      name: valuation.SHORTNAME || config.code,
      code: config.code,
      type: config.type,
      nav: valuation.NAV,
      navDate: valuation.PDATE || '',
      dayChange: typeof valuation.GSZZL === 'number' ? valuation.GSZZL : null,
      estimatedNav: typeof valuation.GSZ === 'number' ? valuation.GSZ : null,
      valuationTime: valuation.GZTIME || null,
      manager: config.manager,
      scale: config.scale,
      returns: histories[i]?.returns,
      sparkline: histories[i]?.sparkline,
    }
  }).filter(Boolean) as FundData[]
}

/* ── Fund Detail ────────────────────────────── */

export interface FundDetail {
  manager?: string
  scale?: string
  holdingsReportDate?: string
  holdingsError?: boolean
  holdings?: {
    name: string
    code: string
    percent: number | null
  }[]
}

export async function fetchFundDetail(code: string): Promise<FundDetail | null> {
  try {
    const result: FundDetail = {}
    
    // 获取基金经理和基金规模
    const detailUrl = `https://fund.eastmoney.com/pingzhongdata/${code}.js?v=${Date.now()}`
    await loadScriptVar<any>(detailUrl, 'Data_currentFundManager', 8000)
    
    const Data_currentFundManager = (window as any).Data_currentFundManager
    const Data_fundInfo = (window as any).Data_fundInfo
    const detailStockCodes = Array.isArray((window as any).stockCodesNew)
      ? [...(window as any).stockCodesNew] as string[]
      : []
    
    // 基金经理
    if (Data_currentFundManager && Array.isArray(Data_currentFundManager) && Data_currentFundManager.length > 0) {
      result.manager = Data_currentFundManager[0].name
    }
    
    // 基金规模
    if (Data_fundInfo && Data_fundInfo.FUND_SCALE) {
      const scale = parseFloat(Data_fundInfo.FUND_SCALE)
      if (scale >= 1) {
        result.scale = scale.toFixed(2) + '亿'
      } else {
        result.scale = (scale * 10000).toFixed(2) + '万'
      }
    }
    
    // 清理
    ;(window as any).Data_currentFundManager = undefined
    ;(window as any).Data_fundInfo = undefined
    
    try {
      type PositionData = {
        Success?: boolean
        ErrCode?: number
        ErrMsg?: string | null
        Expansion?: string | null
        Datas?: {
          fundStocks?: Array<{
            GPDM?: string
            GPJC?: string
            JZBL?: string | number
          }>
        }
      }

      const clients: Array<Record<string, string>> = [
        {
          deviceid: '3EA024C2-7F22-408B-95E4-383D38160FB3',
          plat: 'Iphone',
          product: 'EFund',
          version: '6.3.8',
          appType: 'ttjj',
          serverVersion: '6.3.8',
        },
        {
          deviceid: '1234567890',
          plat: 'Android',
          product: 'EFund',
          version: '6.3.8',
        },
      ]
      let positionData: PositionData | null = null
      let lastError: unknown

      for (const client of clients) {
        const params = new URLSearchParams({ FCODE: code, ...client })
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)
        try {
          const response = await fetch(
            `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNInverstPosition?${params}`,
            { signal: controller.signal, cache: 'no-store' }
          )
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const data = await response.json() as PositionData
          if (!data.Success || data.ErrCode !== 0) {
            throw new Error(data.ErrMsg || 'Fund holdings request failed')
          }
          positionData = data
          break
        } catch (error) {
          lastError = error
        } finally {
          clearTimeout(timer)
        }
      }
      if (!positionData) throw lastError instanceof Error ? lastError : new Error('Fund holdings request failed')

      result.holdingsReportDate = positionData.Expansion || undefined
      result.holdings = (positionData.Datas?.fundStocks || [])
        .filter((item) => item.GPDM && item.GPJC)
        .slice(0, 10)
        .map((item) => ({
          name: String(item.GPJC),
          code: String(item.GPDM),
          percent: Number(item.JZBL) || 0,
        }))
    } catch (error) {
      try {
        if (!detailStockCodes.length) throw error
        const secids = detailStockCodes.slice(0, 10)
        const quoteUrl = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=f12,f14&secids=${secids.join(',')}&_=${Date.now()}`
        const quoteData = await jsonp<any>(quoteUrl, 'cb')
        const quotes = Array.isArray(quoteData?.data?.diff) ? quoteData.data.diff : []
        const quoteMap = new Map<string, string>(
          quotes.map((item: any): [string, string] => [String(item.f12), String(item.f14 || item.f12)])
        )
        result.holdings = secids.map((secid) => {
          const code = secid.split('.').pop() || secid
          return {
            name: quoteMap.get(code) || code,
            code,
            percent: null,
          }
        })
      } catch (fallbackError) {
        result.holdingsError = true
        console.error('Failed to fetch fund holdings:', fallbackError)
      }
    }
    
    return result
  } catch (e) {
    console.error('fetchFundDetail error:', e)
    return null
  }
}

/* ── Fund Ranking ───────────────────────────── */

export async function fetchFundRanking(): Promise<FundRankingData[]> {
  try {
    // 按基金类型分别请求 push2 API，直接从请求参数确定类型，不依赖名称推断
    // 这样能准确分类，避免基金简称不含类型关键词导致全部归为"其他"
    const boards = [
      { fs: 'b:mk0021', type: '股票型' },
      { fs: 'b:mk0022', type: '混合型' },
      { fs: 'b:mk0023', type: '指数型' },
      { fs: 'b:mk0024', type: 'QDII' },
    ]

    const results = await Promise.all(
      boards.map(async ({ fs, type }) => {
        const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=f2,f3,f12,f14,f22,f23,f24,f25&_=${Date.now()}`
        const data = await jsonp<any>(url, 'cb')
        if (data.rc !== 0 || !data.data?.diff) return []
        return data.data.diff
          .filter((item: any) => typeof item.f2 === 'number' && item.f2 > 0)
          .map((item: any) => ({
            code: String(item.f12 || ''),
            name: item.f14 || '',
            type,
            nav: typeof item.f2 === 'number' ? item.f2 : 0,
            navDate: '',
            dayChange: typeof item.f3 === 'number' ? item.f3 : 0,
            weekChange: typeof item.f22 === 'number' ? item.f22 : 0,
            monthChange: typeof item.f23 === 'number' ? item.f23 : 0,
            threeMonth: typeof item.f24 === 'number' ? item.f24 : 0,
            sixMonth: typeof item.f25 === 'number' ? item.f25 : 0,
            oneYear: 0,
            twoYear: 0,
          }))
      })
    )

    const allFunds = results.flat()

    // push2 基金接口不提供近1年/近2年收益率，通过 pingzhongdata 补全
    // 按日涨幅排序后取前15只，逐一加载（loadScriptVar 使用全局变量，须串行）
    allFunds.sort((a, b) => Math.abs(b.dayChange) - Math.abs(a.dayChange))
    const limit = Math.min(15, allFunds.length)
    for (let i = 0; i < limit; i++) {
      try {
        const history = await fetchFundHistory(allFunds[i].code)
        if (history?.returns) {
          allFunds[i].oneYear = history.returns.oneYear
        }
      } catch { /* 忽略单只基金的加载失败 */ }
    }

    return allFunds.slice(0, 30)
  } catch (err) {
    console.error('[fetchFundRanking] error:', err)
    return []
  }
}

export async function fetchYesterdayFundRanking(): Promise<FundRankingData[]> {
  try {
    ;(window as any).db = undefined
    const url = `https://fund.eastmoney.com/Data/Fund_JJJZ_Data.aspx?t=1&lx=1&letter=&gsid=&text=&sort=zdf,desc&page=1,50&dt=&atfc=&onlySale=0&_=${Date.now()}`
    const data = await loadScriptVar<any>(url, 'db', 10000)
    ;(window as any).db = undefined

    if (!data?.datas || !Array.isArray(data.datas)) return []

    const navDate = Array.isArray(data.showday) ? String(data.showday[0] || '') : ''

    return data.datas
      .filter((item: any[]) => {
        const name = String(item[1] || '')
        const nav = parseFloat(item[3])
        const dayChange = parseFloat(item[8])
        const isExchangeFund = (/ETF/i.test(name) && !name.includes('ETF联接')) || /LOF|REIT/i.test(name)
        return !isExchangeFund && Number.isFinite(nav) && nav > 0 && Number.isFinite(dayChange)
      })
      .map((item: any[]) => ({
        code: String(item[0] || ''),
        name: String(item[1] || ''),
        type: inferFundType(String(item[1] || '')),
        nav: parseFloat(item[3]) || 0,
        navDate,
        dayChange: parseFloat(item[8]) || 0,
        weekChange: 0,
        monthChange: 0,
        threeMonth: 0,
        sixMonth: 0,
        oneYear: 0,
        twoYear: 0,
      }))
      .slice(0, 20)
  } catch (err) {
    console.error('[fetchYesterdayFundRanking] error:', err)
    return []
  }
}

/* ── Daily Market Analysis ─────────────────── */

export async function fetchMarketStats(): Promise<MarketStatsData | null> {
  try {
    const [shRes, szRes, turnoverRes, limitUpRes, limitDownRes] = await Promise.allSettled([
      jsonp<any>(
        `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001&fields=f104,f105,f106&_=${Date.now()}`,
        'cb'
      ),
      jsonp<any>(
        `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=0.399001&fields=f104,f105,f106&_=${Date.now()}`,
        'cb'
      ),
      jsonp<any>(
        `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001,0.399001&fields=f6&_=${Date.now()}`,
        'cb'
      ),
      jsonp<any>(
        `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=5000&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f3&_=${Date.now()}`,
        'cb'
      ),
      jsonp<any>(
        `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=5000&po=0&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f3&_=${Date.now()}`,
        'cb'
      ),
    ])

    let advancers = 0, decliners = 0, unchanged = 0

    // 沪市涨跌家数
    if (shRes.status === 'fulfilled' && shRes.value?.data?.diff?.[0]) {
      const d = shRes.value.data.diff[0]
      advancers += typeof d.f104 === 'number' ? d.f104 : 0
      decliners += typeof d.f105 === 'number' ? d.f105 : 0
      unchanged += typeof d.f106 === 'number' ? d.f106 : 0
    }

    // 深市涨跌家数
    if (szRes.status === 'fulfilled' && szRes.value?.data?.diff?.[0]) {
      const d = szRes.value.data.diff[0]
      advancers += typeof d.f104 === 'number' ? d.f104 : 0
      decliners += typeof d.f105 === 'number' ? d.f105 : 0
      unchanged += typeof d.f106 === 'number' ? d.f106 : 0
    }

    let totalTurnover = 0
    if (turnoverRes.status === 'fulfilled' && turnoverRes.value?.data?.diff) {
      for (const item of turnoverRes.value.data.diff) {
        if (typeof item.f6 === 'number') totalTurnover += item.f6
      }
    }

    let limitUp = 0
    if (limitUpRes.status === 'fulfilled' && limitUpRes.value?.data?.diff) {
      limitUp = limitUpRes.value.data.diff.filter(
        (item: any) => typeof item.f3 === 'number' && item.f3 >= 9.9
      ).length
    }

    let limitDown = 0
    if (limitDownRes.status === 'fulfilled' && limitDownRes.value?.data?.diff) {
      limitDown = limitDownRes.value.data.diff.filter(
        (item: any) => typeof item.f3 === 'number' && item.f3 <= -9.9
      ).length
    }

    return { advancers, decliners, unchanged, limitUp, limitDown, totalTurnover }
  } catch (err) {
    console.error('[fetchMarketStats] error:', err)
    return null
  }
}

export async function fetchSectorRanking(
  type: 'industry' | 'concept',
  pageSize = 10
): Promise<SectorData[]> {
  try {
    const fs = type === 'industry' ? 'm:90+t:2' : 'm:90+t:3'
    const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${pageSize}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=f2,f3,f4,f12,f14,f104,f105,f128,f140&_=${Date.now()}`
    const data = await jsonp<any>(url, 'cb')

    if (data.rc !== 0 || !data.data?.diff) return []

    return data.data.diff
      .filter((item: any) => typeof item.f3 === 'number')
      .map((item: any) => ({
        name: item.f14 || '',
        code: String(item.f12 || ''),
        changePercent: item.f3,
        change: typeof item.f4 === 'number' ? item.f4 : 0,
        price: typeof item.f2 === 'number' ? item.f2 : 0,
        advancers: typeof item.f104 === 'number' ? item.f104 : 0,
        decliners: typeof item.f105 === 'number' ? item.f105 : 0,
        leadStock: item.f128 || '--',
        leadStockCode: item.f140 || '',
      }))
  } catch (err) {
    console.error(`[fetchSectorRanking] ${type} error:`, err)
    return []
  }
}

/** 获取所有行业板块（用于热力图，包含涨跌） */
export async function fetchAllIndustrySectors(): Promise<SectorData[]> {
  try {
    const fs = 'm:90+t:2'
    const allSectors: SectorData[] = []
    let page = 1
    const pageSize = 200

    while (true) {
      const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=${page}&pz=${pageSize}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${fs}&fields=f2,f3,f4,f12,f14,f104,f105,f128,f140&_=${Date.now()}`
      const data = await jsonp<any>(url, 'cb')

      if (data.rc !== 0 || !data.data?.diff?.length) break

      const items = data.data.diff
        .filter((item: any) => typeof item.f3 === 'number')
        .map((item: any) => ({
          name: item.f14 || '',
          code: String(item.f12 || ''),
          changePercent: item.f3,
          change: typeof item.f4 === 'number' ? item.f4 : 0,
          price: typeof item.f2 === 'number' ? item.f2 : 0,
          advancers: typeof item.f104 === 'number' ? item.f104 : 0,
          decliners: typeof item.f105 === 'number' ? item.f105 : 0,
          leadStock: item.f128 || '--',
          leadStockCode: item.f140 || '',
        }))

      allSectors.push(...items)

      if (items.length < pageSize) break
      page++
    }

    return allSectors
  } catch (err) {
    console.error('[fetchAllIndustrySectors] error:', err)
    return []
  }
}

export async function fetchSectorCapitalFlow(): Promise<SectorCapitalFlowData[]> {
  try {
    const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&fltt=2&invt=2&fid=f62&fs=m:90+t:2&fields=f12,f14,f2,f3,f62,f184,f66,f72&_=${Date.now()}`
    const data = await jsonp<any>(url, 'cb')

    if (data.rc !== 0 || !data.data?.diff) return []

    return data.data.diff
      .filter((item: any) => typeof item.f62 === 'number')
      .map((item: any) => ({
        name: item.f14 || '',
        code: String(item.f12 || ''),
        changePercent: typeof item.f3 === 'number' ? item.f3 : 0,
        mainNetInflow: item.f62,
        mainNetRatio: typeof item.f184 === 'number' ? item.f184 : 0,
        superLargeNet: typeof item.f66 === 'number' ? item.f66 : 0,
        largeNet: typeof item.f72 === 'number' ? item.f72 : 0,
      }))
  } catch (err) {
    console.error('[fetchSectorCapitalFlow] error:', err)
    return []
  }
}

/* ── Turnover Trend (分时累计成交额) ─────────────────── */

/**
 * 解析东方财富 trends2 分时数据
 * 数据格式："YYYY-MM-DD HH:mm,价格,均价,成交量,成交额,..."
 * 返回按日期分组的分钟级成交额数据
 */
function parseTrends2(trends: string[]): Map<string, { time: string; turnover: number }[]> {
  const grouped = new Map<string, { time: string; turnover: number }[]>()
  for (const item of trends) {
    const parts = item.split(',')
    if (parts.length < 7) continue
    const dateTime = parts[0]
    const [date, time] = dateTime.split(' ')
    if (!date || !time) continue
    // 数据格式: 日期,成交量?,价格,当前价,均价,成交量,成交额,均价
    // 索引6 = f6 = 成交额（元）
    const turnover = parseFloat(parts[6]) || 0
    const hm = time.slice(0, 5)
    if (!grouped.has(date)) grouped.set(date, [])
    grouped.get(date)!.push({ time: hm, turnover })
  }
  return grouped
}

/**
 * 将单分钟成交额累加为累计成交额
 */
function accumulateTurnover(points: { time: string; turnover: number }[]): TurnoverTrendPoint[] {
  let sum = 0
  return points.map((p) => {
    sum += p.turnover
    return { time: p.time, turnover: sum }
  })
}

/**
 * 合并两市分时数据（同时间点成交额相加）
 */
function mergeTwoMarkets(
  sh: { time: string; turnover: number }[],
  sz: { time: string; turnover: number }[]
): { time: string; turnover: number }[] {
  const map = new Map<string, number>()
  for (const p of sh) map.set(p.time, (map.get(p.time) || 0) + p.turnover)
  for (const p of sz) map.set(p.time, (map.get(p.time) || 0) + p.turnover)
  const times = Array.from(map.keys()).sort()
  return times.map((t) => ({ time: t, turnover: map.get(t) || 0 }))
}

export async function fetchTurnoverTrend(): Promise<TurnoverTrendData | null> {
  try {
    const fields1 = 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13'
    const fields2 = 'f51,f52,f53,f54,f55,f56,f57,f58'

    const [shRes, szRes, shQuoteRes, szQuoteRes] = await Promise.allSettled([
      jsonp<any>(
        `https://push2his.eastmoney.com/api/qt/stock/trends2/get?fields1=${fields1}&fields2=${fields2}&ut=fa5fd1943c7b386f172d6893dbfba10b&ndays=2&iscr=0&iscca=0&secid=1.000001&_=${Date.now()}`,
        'cb'
      ),
      jsonp<any>(
        `https://push2his.eastmoney.com/api/qt/stock/trends2/get?fields1=${fields1}&fields2=${fields2}&ut=fa5fd1943c7b386f172d6893dbfba10b&ndays=2&iscr=0&iscca=0&secid=0.399001&_=${Date.now()}`,
        'cb'
      ),
      jsonp<any>(
        `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001&fields=f3&_=${Date.now()}`,
        'cb'
      ),
      jsonp<any>(
        `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=0.399001&fields=f3&_=${Date.now()}`,
        'cb'
      ),
    ])

    const shTrends: string[] = shRes.status === 'fulfilled' ? (shRes.value?.data?.trends || []) : []
    const szTrends: string[] = szRes.status === 'fulfilled' ? (szRes.value?.data?.trends || []) : []

    if (shTrends.length === 0 && szTrends.length === 0) {
      return null
    }

    const shGrouped = parseTrends2(shTrends)
    const szGrouped = parseTrends2(szTrends)

    // 按日期排序：最新的是今日，之前的是昨日
    const allDates = Array.from(new Set([...shGrouped.keys(), ...szGrouped.keys()])).sort()
    if (allDates.length === 0) return null

    const todayDate = allDates[allDates.length - 1]
    const prevDate = allDates.length > 1 ? allDates[allDates.length - 2] : ''

    const todaySh = shGrouped.get(todayDate) || []
    const todaySz = szGrouped.get(todayDate) || []
    const prevSh = prevDate ? (shGrouped.get(prevDate) || []) : []
    const prevSz = prevDate ? (szGrouped.get(prevDate) || []) : []

    // 合并两市分钟成交额
    const todayMerged = mergeTwoMarkets(todaySh, todaySz)
    const prevMerged = mergeTwoMarkets(prevSh, prevSz)

    // 累加成累计成交额
    const today = accumulateTurnover(todayMerged)
    const prev = accumulateTurnover(prevMerged)

    const currentPoint = today[today.length - 1]
    const currentTime = currentPoint?.time || ''
    const currentTurnover = currentPoint?.turnover || 0

    // 昨日同时点成交额
    let prevSameTimeTurnover = 0
    if (currentTime && prev.length > 0) {
      // 查找小于等于 currentTime 的最后一个点
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].time <= currentTime) {
          prevSameTimeTurnover = prev[i].turnover
          break
        }
      }
      if (prevSameTimeTurnover === 0) prevSameTimeTurnover = prev[0].turnover
    }

    const prevTotalTurnover = prev.length > 0 ? prev[prev.length - 1].turnover : 0
    const growthPercent = prevSameTimeTurnover > 0
      ? ((currentTurnover - prevSameTimeTurnover) / prevSameTimeTurnover) * 100
      : 0

    // 取指数涨跌幅
    let shChangePercent = 0
    let szChangePercent = 0
    if (shQuoteRes.status === 'fulfilled') {
      const d = shQuoteRes.value?.data?.diff?.[0]
      if (d && typeof d.f3 === 'number') shChangePercent = d.f3
    }
    if (szQuoteRes.status === 'fulfilled') {
      const d = szQuoteRes.value?.data?.diff?.[0]
      if (d && typeof d.f3 === 'number') szChangePercent = d.f3
    }

    return {
      today,
      prev,
      currentTime,
      currentTurnover,
      prevSameTimeTurnover,
      prevTotalTurnover,
      growthPercent,
      shChangePercent,
      szChangePercent,
    }
  } catch (err) {
    return null
  }
}

export async function fetchHeatmapData(): Promise<HeatmapSector[]> {
  try {
    const sectorUrl = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=30&po=1&np=1&fltt=2&invt=2&fid=f20&fs=m:90+t:2+f:!50&fields=f3,f12,f14,f20&_=${Date.now()}`
    const sectorData = await jsonp<any>(sectorUrl, 'cb')

    if (sectorData.rc !== 0 || !sectorData.data?.diff) return []

    const topSectors = sectorData.data.diff
      .filter((item: any) => typeof item.f3 === 'number' && typeof item.f20 === 'number' && item.f20 > 0)
      .slice(0, 20) // 减少板块数量到20个，提高速度
      .map((item: any) => ({
        name: item.f14 || '',
        code: String(item.f12 || ''),
        changePercent: item.f3,
        marketCap: item.f20,
      }))

    const results: HeatmapSector[] = await Promise.all(
      topSectors.map(async (sector: { name: string; code: string; changePercent: number; marketCap: number }) => {
        try {
          const stockUrl = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=15&po=1&np=1&fltt=2&invt=2&fid=f20&fs=b:${sector.code}&fields=f3,f12,f14,f20&_=${Date.now()}`
          const stockData = await jsonp<any>(stockUrl, 'cb')

          if (stockData.rc !== 0 || !stockData.data?.diff) return null

          const stocks: HeatmapStock[] = stockData.data.diff
            .filter((item: any) => typeof item.f3 === 'number' && typeof item.f20 === 'number' && item.f20 > 0)
            .map((item: any) => ({
              name: item.f14 || '',
              code: String(item.f12 || ''),
              changePercent: item.f3,
              marketCap: item.f20,
            }))

          if (stocks.length > 0) {
            return {
              name: sector.name,
              code: sector.code,
              changePercent: sector.changePercent,
              marketCap: sector.marketCap,
              stocks,
            }
          }
          return null
        } catch {
          return null
        }
      })
    ).then((res: (HeatmapSector | null)[]) => res.filter((s): s is HeatmapSector => s !== null))

    return results
  } catch (err) {
    console.error('[fetchHeatmapData] error:', err)
    return []
  }
}

export async function fetchDailyAnalysis(options: { includeHeatmap?: boolean } = {}): Promise<DailyAnalysisData> {
  const [statsRes, allIndustryRes, industryRes, conceptRes, flowRes, trendRes, heatmapRes] = await Promise.allSettled([
    fetchMarketStats(),
    fetchAllIndustrySectors(),
    fetchSectorRanking('industry', 10),
    fetchSectorRanking('concept'),
    fetchSectorCapitalFlow(),
    fetchTurnoverTrend(),
    options.includeHeatmap ? fetchHeatmapData() : Promise.resolve([]),
  ])

  return {
    marketStats: statsRes.status === 'fulfilled' ? statsRes.value : null,
    industrySectors: industryRes.status === 'fulfilled' ? industryRes.value : [],
    allIndustrySectors: allIndustryRes.status === 'fulfilled' ? allIndustryRes.value : [],
    conceptSectors: conceptRes.status === 'fulfilled' ? conceptRes.value : [],
    capitalFlow: flowRes.status === 'fulfilled' ? flowRes.value : [],
    turnoverTrend: trendRes.status === 'fulfilled' ? trendRes.value : null,
    heatmapData: heatmapRes.status === 'fulfilled' ? heatmapRes.value : [],
  }
}

export async function generateDailyAiAnalysis(
  indices: IndexData[],
  dailyAnalysis: DailyAnalysisData
): Promise<DailyAiAnalysis> {
  const fallback = buildRuleBasedAiAnalysis(dailyAnalysis, indices)

  if (!hasAiConfig()) return fallback

  try {
    const config = getAiConfig()
    const baseUrl = config.baseUrl.replace(/\/+$/, '')
    const userPrompt = buildAiUserPrompt(dailyAnalysis, indices)

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的中国股市分析师，擅长用简洁、客观的中文总结当日市场情况。请严格按要求输出 JSON，不要添加任何额外内容。',
          },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 600,
      }),
    })

    if (!response.ok) {
      console.warn('[AiAnalysis] API returned', response.status)
      return fallback
    }

    const json = await response.json()
    const raw = json?.choices?.[0]?.message?.content
    if (!raw || typeof raw !== 'string') return fallback

    const provider = config.baseUrl.includes('deepseek') ? 'DeepSeek' : config.baseUrl.includes('groq') ? 'Groq' : 'OpenAI'

    return parseAiAnalysis(raw, fallback, provider)
  } catch (err) {
    console.warn('[AiAnalysis] fetch error:', err)
    return fallback
  }
}
