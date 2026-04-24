import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    if (!code) {
      return NextResponse.json({ returns: null, sparkline: [] })
    }

    const url = `https://fund.eastmoney.com/pingzhongdata/${code}.js`

    const response = await fetch(url, {
      headers: {
        Referer: 'https://fund.eastmoney.com/',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    })

    const text = await response.text()

    const syl1yMatch = text.match(/var syl_1y\s*=\s*"([^"]*)"/)
    const syl3yMatch = text.match(/var syl_3y\s*="([^"]*)"/)
    const syl6yMatch = text.match(/var syl_6y\s*="([^"]*)"/)
    const syl1nMatch = text.match(/var syl_1n\s*="([^"]*)"/)

    if (!syl1yMatch && !syl3yMatch && !syl6yMatch && !syl1nMatch) {
      return NextResponse.json({ returns: null, sparkline: [] })
    }

    let oneWeek = 0
    const trendMatch = text.match(/var Data_netWorthTrend\s*=\s*\[([\s\S]*?)\];/)
    let sparkline: number[] = []

    if (trendMatch) {
      const yValues = trendMatch[1].match(/"y":([\d.-]+)/g) || []
      const navList = yValues.map((v) => parseFloat(v.split(':')[1]))
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
      oneMonth: parseFloat(syl1yMatch?.[1] || '0'),
      threeMonth: parseFloat(syl3yMatch?.[1] || '0'),
      sixMonth: parseFloat(syl6yMatch?.[1] || '0'),
      oneYear: parseFloat(syl1nMatch?.[1] || '0'),
    }

    return NextResponse.json({ returns, sparkline })
  } catch (err) {
    console.error('Fund history API error:', err)
    return NextResponse.json({ returns: null, sparkline: [] })
  }
}
