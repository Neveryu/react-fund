import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pn = searchParams.get('pn') || '20'

    const today = new Date()
    const oneYearAgo = new Date(today)
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const sd = oneYearAgo.toISOString().split('T')[0]
    const ed = today.toISOString().split('T')[0]

    const url = `https://fund.eastmoney.com/data/rankhandler.aspx?op=ph&dt=kf&ft=all&rs=&gs=0&sc=zzf&st=desc&sd=${sd}&ed=${ed}&qdii=&tabSubtype=,,,,,&pi=1&pn=${pn}&dx=1&v=${Date.now()}`

    const response = await fetch(url, {
      headers: {
        Referer: 'https://fund.eastmoney.com/data/fundranking.html',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    })

    const buffer = await response.arrayBuffer()
    const decoder = new TextDecoder('gbk')
    const text = decoder.decode(buffer)

    const datasMatch = text.match(/datas:\[([\s\S]*?)\]\s*,\s*allRecords/)
    if (!datasMatch) {
      return NextResponse.json({ data: [] })
    }

    const itemsStr = datasMatch[1]
    const items = itemsStr.match(/"[^"]*"/g) || []

    const funds = items
      .map((item) => {
        const raw = item.slice(1, -1)
        const p = raw.split(',')
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
        }
      })
      .filter((f) => f.code && f.nav > 0)

    return NextResponse.json({ data: funds })
  } catch (err) {
    console.error('Fund ranking API error:', err)
    return NextResponse.json({ data: [] })
  }
}
