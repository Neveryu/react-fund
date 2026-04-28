import type { IndexData, StockData, FundData, FundRankingData } from './data'

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

export async function fetchIndices(): Promise<IndexData[]> {
  try {
    const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=${SECIDS.join(',')}&fields=f1,f2,f3,f4,f12,f13,f14&_=${Date.now()}`
    const data = await jsonp<any>(url, 'cb')

    if (data.rc !== 0 || !data.data?.diff) {
      return []
    }

    const sparklineMap = new Map<string, number[]>()
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
        } catch {
          /* sparkline is optional */
        }
      })
    )

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
    const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=10&po=1&np=1&fltt=2&invt=2&fid=f6&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f2,f3,f4,f5,f6,f12,f14,f15,f16&_=${Date.now()}`
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

function fetchFundNav(
  code: string
): Promise<{ name: string; nav: number; dayChange: number; navDate: string } | null> {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    let done = false

    const cleanup = () => {
      done = true
      delete (window as any).jsonpgz
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    ;(window as any).jsonpgz = (data: any) => {
      resolve({
        name: data.name,
        nav: parseFloat(data.dwjz),
        dayChange: parseFloat(data.gszzl),
        navDate: data.jzrq,
      })
      cleanup()
    }

    script.src = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`
    script.onerror = () => {
      if (!done) resolve(null)
      cleanup()
    }

    document.head.appendChild(script)
    setTimeout(() => {
      if (!done) {
        resolve(null)
        cleanup()
      }
    }, 5000)
  })
}

async function fetchFundHistory(
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
    console.log('[fetchStocksByCodes] codes:', codes, '→ secids:', secids)
    const data = await jsonp<any>(url, 'cb')
    console.log('[fetchStocksByCodes] rc:', data?.rc, 'diff count:', data?.data?.diff?.length)
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
  items: { code: string; type: string; manager?: string }[]
): Promise<FundData[]> {
  if (!items.length) return []

  const codes = items.map((i) => i.code)
  const historyPromises = codes.map((code) => fetchFundHistory(code))

  const navs: (Awaited<ReturnType<typeof fetchFundNav>>)[] = []
  for (const code of codes) {
    navs.push(await fetchFundNav(code))
  }

  const histories = await Promise.all(historyPromises)

  return items
    .map((item, i) => {
      const nav = navs[i]
      if (!nav) return null
      return {
        name: nav.name,
        code: item.code,
        type: item.type,
        nav: nav.nav,
        navDate: nav.navDate,
        dayChange: nav.dayChange,
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

  const navs: (Awaited<ReturnType<typeof fetchFundNav>>)[] = []
  for (const config of FUND_CONFIG) {
    navs.push(await fetchFundNav(config.code))
  }

  const histories = await Promise.all(historyPromises)

  return FUND_CONFIG.map((config, i) => {
    const nav = navs[i]
    if (!nav) return null
    return {
      name: nav.name,
      code: config.code,
      type: config.type,
      nav: nav.nav,
      navDate: nav.navDate,
      dayChange: nav.dayChange,
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
  holdings?: {
    name: string
    code: string
    percent: number
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
    
    // 获取持仓信息 - 使用 JSONP 方式（不受 CORS 限制）
    try {
      const holdingsUrl = `https://fundf10.eastmoney.com/FundArchivesDatas.aspx?type=jjcc&code=${code}&topline=10&year=&month=&_=${Date.now()}`
      
      const holdingsData = await jsonp<any>(holdingsUrl, 'callback')
      console.log('[fetchFundDetail] holdingsData:', JSON.stringify(holdingsData)?.substring(0, 1000))
      
      // 尝试从不同数据结构中获取持仓
      const holdingsArray = holdingsData?.content || holdingsData?.datas || 
                           (holdingsData?.Array && holdingsData.Array[0]?.holdingList) ||
                           (Array.isArray(holdingsData) ? holdingsData : null)
      
      if (holdingsArray && Array.isArray(holdingsArray)) {
        result.holdings = holdingsArray.slice(0, 10).map((item: any) => ({
          name: item.SNAME || item.name || item.股票名称 || item.holdingName || '',
          code: item.SCODE || item.code || item.股票代码 || item.holdingCode || '',
          percent: parseFloat(item.JZBL || item.ratio || item.持仓比例 || item.占净值比例 || item.holdingPercent || '0'),
        })).filter((item: any) => item.name && item.code)
      }
    } catch {
      // 持仓请求失败，忽略错误
    }
    
    return result
  } catch (e) {
    console.error('fetchFundDetail error:', e)
    return null
  }
}

/* ── Fund Ranking ───────────────────────────── */

export async function fetchFundRanking(): Promise<FundRankingData[]> {
  // sc=rzdf: 按日涨幅排序; 不带日期范围则自动取最近交易日
  const url = `https://fund.eastmoney.com/data/rankhandler.aspx?op=ph&dt=kf&ft=all&rs=&gs=0&sc=rzdf&st=desc&qdii=&tabSubtype=,,,,,&pi=1&pn=20&dx=1&v=${Date.now()}`

  let itemStrings: string[] = []

  // Use fetch + regex parse (script tag can't set Referer header which API requires)
  try {
    const resp = await fetch(url, {
      headers: {
        'Referer': 'https://fund.eastmoney.com/data/fundranking.html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
    const text = await resp.text()
    // Parse: var rankData = {datas:["item1,item2,...", "item2,item2,..."], ...}
    // Each item is a quoted string: "code,name,..." — extract with "([^"]*)" regex
    const itemMatches = text.matchAll(/"([^"]*)"/g)
    for (const m of itemMatches) {
      const val = m[1]
      // Items start with a 6-digit fund code followed by comma
      if (/^\d{6},/.test(val)) {
        itemStrings.push(val)
      }
      // Stop after we collect the items (there are other quoted fields after datas[])
      if (itemStrings.length > 0 && !val.includes(',')) {
        // Hit a non-comma field, stop
        break
      }
    }
  } catch (e) {
    console.error('fetchFundRanking fetch failed:', e)
  }

  // Fallback: try script tag
  if (!itemStrings.length) {
    ;(window as any).rankData = undefined
    const fallback = await loadScriptVar<{ datas: string[] }>(url, 'rankData', 8000)
    if (fallback?.datas?.length) {
      itemStrings = fallback.datas
    }
  }

  if (!itemStrings.length) return []

  const funds = itemStrings
    .map((item: string) => {
      const p = item.split(',')
      const name = p[1] || ''
      return {
        code: p[0] || '',
        name,
        type: inferFundType(name),
        nav: parseFloat(p[4]) || 0,
        navDate: p[3] || '',
        dayChange: parseFloat(p[6]) || 0,
        weekChange: parseFloat(p[7]) || 0,
        monthChange: parseFloat(p[8]) || 0,
        threeMonth: parseFloat(p[9]) || 0,
        sixMonth: parseFloat(p[10]) || 0,
        oneYear: parseFloat(p[11]) || 0,
        twoYear: parseFloat(p[12]) || 0,
      }
    })
    .filter((f: FundRankingData) => f.code && f.nav > 0)

  ;(window as any).rankData = undefined
  return funds
}
