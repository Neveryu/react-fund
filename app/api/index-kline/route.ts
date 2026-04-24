import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const INDEX_SECIDS: Record<string, string> = {
  '000001': '1.000001',
  '399001': '0.399001',
  '399006': '0.399006',
  HSI: '100.HSI',
  NDX: '100.NDX',
  SPX: '100.SPX',
  N225: '100.N225',
  FTSE: '100.FTSE',
  KS11: '100.KS11',
}

const KLT_MAP: Record<string, string> = {
  day: '101',
  week: '102',
  month: '103',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const klt = searchParams.get('klt') || 'day'
    const lmt = searchParams.get('lmt') || '120'

    if (!code) {
      return NextResponse.json({ data: null })
    }

    const secid = INDEX_SECIDS[code]
    if (!secid) {
      return NextResponse.json({ data: null })
    }

    const kltValue = KLT_MAP[klt] || '101'

    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&klt=${kltValue}&fqt=1&lmt=${lmt}&end=20500101&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61`

    const response = await fetch(url, {
      headers: {
        Referer: 'https://quote.eastmoney.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    })

    const text = await response.text()

    let data: any
    try {
      data = JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\((\{[\s\S]*\})\)/)
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1])
      } else {
        return NextResponse.json({ data: null })
      }
    }

    if (!data.data?.klines?.length) {
      return NextResponse.json({ data: null })
    }

    const klines = data.data.klines.map((line: string) => {
      const p = line.split(',')
      return {
        date: p[0],
        open: parseFloat(p[1]),
        close: parseFloat(p[2]),
        high: parseFloat(p[3]),
        low: parseFloat(p[4]),
        volume: parseFloat(p[5]),
        change: parseFloat(p[8] || '0'),
        changePercent: parseFloat(p[9] || '0'),
      }
    })

    const name = data.data.name || code

    return NextResponse.json({ data: { name, code, klines } })
  } catch (err) {
    console.error('Index kline API error:', err)
    return NextResponse.json({ data: null })
  }
}
