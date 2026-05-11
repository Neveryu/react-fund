import type { DailyAiAnalysis, DailyAnalysisData, IndexData } from './data'

export interface DailySummaryStat {
  label: string
  value: string
  hint: string
  tone: 'up' | 'down' | 'neutral'
}

export interface DailyMarketSummary {
  headline: string
  summaryLines: string[]
  stats: DailySummaryStat[]
  sentiment: DailyAiAnalysis['sentiment']
}

export function formatTurnover(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}万亿`
  if (value >= 1e8) return `${(value / 1e8).toFixed(0)}亿`
  return value.toFixed(0)
}

export function formatMarketName(index: IndexData): string {
  const marketMap: Record<string, string> = {
    CN: '中国',
    HK: '中国香港',
    US: '美国',
    JP: '日本',
    EU: '英国',
    KR: '韩国',
  }

  return marketMap[index.market] || index.name
}

export function buildMarketSummary(
  data: DailyAnalysisData,
  indices: IndexData[]
): DailyMarketSummary {
  const rising = indices.filter((item) => item.changePercent > 0)
  const falling = indices.filter((item) => item.changePercent < 0)
  const flat = indices.filter((item) => item.changePercent === 0)
  const sorted = [...indices].sort((a, b) => b.changePercent - a.changePercent)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  const averageMove =
    indices.length > 0
      ? indices.reduce((sum, item) => sum + item.changePercent, 0) / indices.length
      : 0

  let headline = '全球股市整体分化'
  let sentiment: DailyAiAnalysis['sentiment'] = 'neutral'

  if (rising.length >= Math.max(4, falling.length + 2)) {
    headline = '全球股市整体偏强'
    sentiment = 'bullish'
  } else if (falling.length >= Math.max(4, rising.length + 2)) {
    headline = '全球股市整体承压'
    sentiment = 'bearish'
  }

  const summaryLines: string[] = []

  if (indices.length > 0 && best && worst) {
    summaryLines.push(
      `${headline}，${rising.length} 个指数上涨，${falling.length} 个指数下跌，${flat.length} 个平盘，平均涨跌幅 ${averageMove >= 0 ? '+' : ''}${averageMove.toFixed(2)}%。`
    )
    summaryLines.push(
      `领涨的是 ${best.flag}${best.name}（${best.changePercent >= 0 ? '+' : ''}${best.changePercent.toFixed(2)}%），表现最弱的是 ${worst.flag}${worst.name}（${worst.changePercent >= 0 ? '+' : ''}${worst.changePercent.toFixed(2)}%）。`
    )
  } else {
    summaryLines.push('当前全球指数数据不足，暂时无法生成完整综述。')
  }

  if (data.marketStats) {
    summaryLines.push(
      `A股方面，上涨 ${data.marketStats.advancers} 家，下跌 ${data.marketStats.decliners} 家，平盘 ${data.marketStats.unchanged} 家，两市成交额约 ${formatTurnover(data.marketStats.totalTurnover)}。`
    )
  }

  if (data.capitalFlow.length > 0) {
    const topFlow = [...data.capitalFlow].sort((a, b) => b.mainNetInflow - a.mainNetInflow)[0]
    summaryLines.push(
      `资金面上，${topFlow.name}主力净流入居前，净流入约 ${formatTurnover(Math.abs(topFlow.mainNetInflow))}，板块涨跌幅 ${topFlow.changePercent >= 0 ? '+' : ''}${topFlow.changePercent.toFixed(2)}%。`
    )
  }

  if (data.industrySectors.length > 0) {
    const topSector = [...data.industrySectors].sort((a, b) => b.changePercent - a.changePercent)[0]
    summaryLines.push(
      `板块热度方面，${topSector.name}表现最强，涨幅 ${topSector.changePercent >= 0 ? '+' : ''}${topSector.changePercent.toFixed(2)}%，领涨股为 ${topSector.leadStock}。`
    )
  }

  return {
    headline,
    summaryLines,
    sentiment,
    stats: [
      {
        label: '上涨指数',
        value: `${rising.length}/${indices.length || 0}`,
        hint: indices.length > 0 ? '风险偏好观察' : '等待数据',
        tone: 'up',
      },
      {
        label: '最强市场',
        value: best ? `${best.flag} ${formatMarketName(best)}` : '--',
        hint: best ? `${best.changePercent >= 0 ? '+' : ''}${best.changePercent.toFixed(2)}%` : '暂无数据',
        tone: 'up',
      },
      {
        label: '最弱市场',
        value: worst ? `${worst.flag} ${formatMarketName(worst)}` : '--',
        hint: worst ? `${worst.changePercent >= 0 ? '+' : ''}${worst.changePercent.toFixed(2)}%` : '暂无数据',
        tone: 'down',
      },
      {
        label: '两市成交额',
        value: data.marketStats ? formatTurnover(data.marketStats.totalTurnover) : '--',
        hint: data.turnoverTrend?.currentTime ? `${data.turnoverTrend.currentTime} 截止` : '成交活跃度',
        tone: 'neutral',
      },
    ],
  }
}

export function buildRuleBasedAiAnalysis(
  data: DailyAnalysisData,
  indices: IndexData[]
): DailyAiAnalysis {
  const summary = buildMarketSummary(data, indices)

  return {
    title: summary.headline,
    summary: summary.summaryLines.slice(0, 2).join(' '),
    bullets: summary.summaryLines.slice(2, 5),
    sentiment: summary.sentiment,
    source: 'rule',
  }
}

export function buildAiUserPrompt(
  data: DailyAnalysisData,
  indices: IndexData[]
): string {
  const summary = buildMarketSummary(data, indices)
  const indexLines = indices
    .map(
      (item) =>
        `- ${item.flag}${item.name}(${formatMarketName(item)}): ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%, 点位 ${item.value.toFixed(2)}`
    )
    .join('\n')

  const sectorLines = data.industrySectors
    .slice(0, 3)
    .map(
      (item) =>
        `- ${item.name}: ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%, 领涨股 ${item.leadStock}`
    )
    .join('\n')

  const capitalLines = data.capitalFlow
    .slice(0, 3)
    .map(
      (item) =>
        `- ${item.name}: 主力净流入 ${formatTurnover(Math.abs(item.mainNetInflow))}, 涨跌幅 ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%`
    )
    .join('\n')

  return [
    '请基于以下真实市场数据，输出中文股市简报。',
    '要求：观点克制、专业、简洁，不夸张，不给出明确投资建议。',
    '请严格返回 JSON，不要添加 markdown 代码块，不要添加额外解释。',
    'JSON 结构：{"title":"", "summary":"", "bullets":["", "", ""], "sentiment":"bullish|bearish|neutral"}',
    '',
    `规则综述参考：${summary.summaryLines.join(' ')}`,
    '',
    '全球指数：',
    indexLines || '- 暂无',
    '',
    'A股概况：',
    data.marketStats
      ? `- 上涨 ${data.marketStats.advancers} 家，下跌 ${data.marketStats.decliners} 家，平盘 ${data.marketStats.unchanged} 家，两市成交额 ${formatTurnover(data.marketStats.totalTurnover)}`
      : '- 暂无',
    '',
    '行业板块：',
    sectorLines || '- 暂无',
    '',
    '资金流向：',
    capitalLines || '- 暂无',
    '',
    '输出要求：',
    '- title: 10-18字，概括今日全球市场',
    '- summary: 60-120字，整体总结',
    '- bullets: 3条，每条 18-40字，分别聚焦全球指数、A股情绪、板块/资金',
    '- sentiment: 只能是 bullish、bearish、neutral',
  ].join('\n')
}

export function parseAiAnalysis(
  raw: string,
  fallback: DailyAiAnalysis,
  provider?: string
): DailyAiAnalysis {
  const clean = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')

  try {
    const parsed = JSON.parse(clean)
    const sentiment =
      parsed.sentiment === 'bullish' || parsed.sentiment === 'bearish' || parsed.sentiment === 'neutral'
        ? parsed.sentiment
        : fallback.sentiment
    const bullets = Array.isArray(parsed.bullets)
      ? parsed.bullets.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 4)
      : []

    return {
      title: String(parsed.title || fallback.title).trim(),
      summary: String(parsed.summary || fallback.summary).trim(),
      bullets: bullets.length > 0 ? bullets : fallback.bullets,
      sentiment,
      source: 'ai',
      provider,
    }
  } catch {
    return fallback
  }
}
