import type { IndexData, StockData, FundData } from './data'

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

/* ── Indices ───────────────────────────────────── */

const INDEX_META: Record<string, { flag: string; market: string; secid: string }> = {
  '000001': { flag: '🇨🇳', market: 'CN', secid: '1.000001' },
  '399001': { flag: '🇨🇳', market: 'CN', secid: '0.399001' },
  '399006': { flag: '🇨🇳', market: 'CN', secid: '0.399006' },
  HSI: { flag: '🇭🇰', market: 'HK', secid: '100.HSI' },
  IXIC: { flag: '🇺🇸', market: 'US', secid: '100.IXIC' },
  SPX: { flag: '🇺🇸', market: 'US', secid: '100.SPX' },
  N225: { flag: '🇯🇵', market: 'JP', secid: '100.N225' },
  FTSE: { flag: '🇬🇧', market: 'EU', secid: '100.FTSE' },
}

const SECIDS = Object.values(INDEX_META).map((m) => m.secid)

export async function fetchIndices(): Promise<IndexData[]> {
  try {
    const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=${SECIDS.join(',')}&fields=f1,f2,f3,f4,f12,f13,f14&_=${Date.now()}`
    const data = await jsonp<any>(url, 'cb')

    if (data.rc !== 0 || !data.data?.diff) return []

    // Fetch sparkline kline data in parallel
    const sparklineMap = new Map<string, number[]>()
    await Promise.all(
      Object.entries(INDEX_META).map(async ([code, meta]) => {
        try {
          const kUrl = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${meta.secid}&klt=101&fqt=1&lmt=15&end=20500101&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56,f57,f58`
          const kData = await jsonp<any>(kUrl, 'cb')
          if (kData.data?.klines) {
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
      .filter((item: any) => typeof item.f2 === 'number' && item.f2 > 0)
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
    console.error('fetchIndices error:', err)
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
        const turnover = item.f6
        let turnoverStr: string
        if (turnover >= 1e8) turnoverStr = (turnover / 1e8).toFixed(1) + '亿'
        else if (turnover >= 1e4) turnoverStr = (turnover / 1e4).toFixed(1) + '万'
        else turnoverStr = String(turnover)

        const volume = item.f5
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
          high: item.f15,
          low: item.f16,
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

/** fundgz uses hardcoded 'jsonpgz' callback → must be sequential */
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
  try {
    const url = `https://api.fund.eastmoney.com/f10/lsjz?fundCode=${code}&pageIndex=1&pageSize=250`
    const data = await jsonp<any>(url, 'callback')

    if (!data.Data?.LSJZList?.length) return null

    const navList: number[] = data.Data.LSJZList.map((item: any) =>
      parseFloat(item.DWJZ)
    ).reverse()

    const len = navList.length
    const cur = navList[len - 1]

    const ret = (lb: number) => {
      const idx = len - 1 - lb
      if (idx < 0) return 0
      const p = navList[idx]
      return p ? ((cur - p) / p) * 100 : 0
    }

    return {
      returns: {
        oneWeek: ret(5),
        oneMonth: ret(22),
        threeMonth: ret(65),
        sixMonth: ret(130),
        oneYear: len > 245 ? ret(245) : ret(len - 1),
      },
      sparkline: navList.slice(Math.max(0, len - 15)),
    }
  } catch {
    return null
  }
}

export async function fetchFunds(): Promise<FundData[]> {
  // History uses unique callbacks → safe to parallelize
  const historyPromises = FUND_CONFIG.map((c) => fetchFundHistory(c.code))

  // NAV uses shared 'jsonpgz' → must be sequential
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
