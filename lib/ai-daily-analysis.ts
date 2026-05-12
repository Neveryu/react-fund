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
  // 全球指数数据
  const indexLines = indices
    .map(
      (item) =>
        `- ${item.flag}${item.name}: ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%, 当前点位 ${item.value.toFixed(2)}`
    )
    .join('\n')

  // A股市场统计
  const marketStatsText = data.marketStats
    ? [
        `- 涨跌家数: 上涨 ${data.marketStats.advancers} 家, 下跌 ${data.marketStats.decliners} 家, 平盘 ${data.marketStats.unchanged} 家`,
        `- 涨跌停: 涨停 ${data.marketStats.limitUp} 家, 跌停 ${data.marketStats.limitDown} 家`,
        `- 两市成交额: ${formatTurnover(data.marketStats.totalTurnover)}`,
        `- 涨跌比: ${data.marketStats.advancers + data.marketStats.decliners > 0 ? ((data.marketStats.advancers / (data.marketStats.advancers + data.marketStats.decliners)) * 100).toFixed(1) : 0}% 的股票上涨`,
      ].join('\n')
    : '- 暂无'

  // 行业板块完整数据
  const industryStats = data.industrySectors.length > 0
    ? [
        `- 行业板块总数: ${data.industrySectors.length} 个`,
        `- 上涨板块: ${data.industrySectors.filter(s => s.changePercent > 0).length} 个`,
        `- 下跌板块: ${data.industrySectors.filter(s => s.changePercent < 0).length} 个`,
        '',
        '涨幅前5行业:',
        ...[...data.industrySectors]
          .sort((a, b) => b.changePercent - a.changePercent)
          .slice(0, 5)
          .map(
            (item) =>
              `  ${item.name}: ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%, 涨/跌 ${item.advancers}/${item.decliners}, 领涨股 ${item.leadStock}`
          ),
        '',
        '跌幅前3行业:',
        ...[...data.industrySectors]
          .sort((a, b) => a.changePercent - b.changePercent)
          .slice(0, 3)
          .map(
            (item) =>
              `  ${item.name}: ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%, 跌/涨 ${item.decliners}/${item.advancers}`
          ),
      ].join('\n')
    : '- 暂无'

  // 概念板块完整数据
  const conceptStats = data.conceptSectors.length > 0
    ? [
        `- 概念板块总数: ${data.conceptSectors.length} 个`,
        `- 上涨概念: ${data.conceptSectors.filter(s => s.changePercent > 0).length} 个`,
        `- 下跌概念: ${data.conceptSectors.filter(s => s.changePercent < 0).length} 个`,
        '',
        '涨幅前5概念:',
        ...[...data.conceptSectors]
          .sort((a, b) => b.changePercent - a.changePercent)
          .slice(0, 5)
          .map(
            (item) =>
              `  ${item.name}: ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%, 涨/跌 ${item.advancers}/${item.decliners}, 领涨股 ${item.leadStock}`
          ),
      ].join('\n')
    : '- 暂无'

  // 资金流向完整数据
  const capitalFlowStats = data.capitalFlow.length > 0
    ? [
        `- 主力资金净流入板块: ${data.capitalFlow.filter(f => f.mainNetInflow > 0).length} 个`,
        `- 主力资金净流出板块: ${data.capitalFlow.filter(f => f.mainNetInflow < 0).length} 个`,
        '',
        '净流入前5板块:',
        ...[...data.capitalFlow]
          .sort((a, b) => b.mainNetInflow - a.mainNetInflow)
          .slice(0, 5)
          .map(
            (item) =>
              `  ${item.name}: 净流入 ${formatTurnover(item.mainNetInflow)}, 占比 ${item.mainNetRatio.toFixed(1)}%, 涨跌幅 ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%`
          ),
        '',
        '净流出前3板块:',
        ...[...data.capitalFlow]
          .sort((a, b) => a.mainNetInflow - b.mainNetInflow)
          .slice(0, 3)
          .map(
            (item) =>
              `  ${item.name}: 净流出 ${formatTurnover(Math.abs(item.mainNetInflow))}, 占比 ${item.mainNetRatio.toFixed(1)}%, 涨跌幅 ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%`
          ),
      ].join('\n')
    : '- 暂无'

  // 成交额趋势分析
  const turnoverTrendText = data.turnoverTrend
    ? [
        `- 当前成交额: ${formatTurnover(data.turnoverTrend.currentTurnover)}`,
        `- 昨日同时段成交: ${formatTurnover(data.turnoverTrend.prevSameTimeTurnover)}`,
        `- 相对昨日变化: ${data.turnoverTrend.growthPercent >= 0 ? '+' : ''}${data.turnoverTrend.growthPercent.toFixed(1)}%`,
        `- 昨日全天成交: ${formatTurnover(data.turnoverTrend.prevTotalTurnover)}`,
        `- 上证指数涨跌幅: ${data.turnoverTrend.shChangePercent >= 0 ? '+' : ''}${data.turnoverTrend.shChangePercent.toFixed(2)}%`,
        `- 深证成指涨跌幅: ${data.turnoverTrend.szChangePercent >= 0 ? '+' : ''}${data.turnoverTrend.szChangePercent.toFixed(2)}%`,
      ].join('\n')
    : '- 暂无'

  return [
    '你是一位资深A股市场分析师，擅长从市场数据中发现趋势、解读情绪、分析资金动向。',
    '请严格基于以下真实市场数据，输出中文股市简报。',
    '要求：',
    '- 观点要克制、专业、简洁',
    '- 不夸大、不夸张、不使用极端词汇',
    '- 不给出明确投资建议（如"买入""卖出"等）',
    '- 用数据说话，有依据地分析',
    '- 自主发现数据中的趋势和特征',
    '请严格返回 JSON，不要添加 markdown 代码块，不要添加额外解释。',
    'JSON 结构：{"title":"", "summary":"", "bullets":["", "", ""], "sentiment":"bullish|bearish|neutral"}',
    '',
    '=== 数据开始 ===',
    '',
    '【全球指数】',
    indexLines || '- 暂无数据',
    '',
    '【A股市场统计】',
    marketStatsText,
    '',
    '【行业板块】',
    industryStats,
    '',
    '【概念板块】',
    conceptStats,
    '',
    '【资金流向】',
    capitalFlowStats,
    '',
    '【成交额趋势】',
    turnoverTrendText,
    '',
    '=== 数据结束 ===',
    '',
    '输出要求：',
    '- title: 10-18字，客观概括今日市场特征',
    '- summary: 80-150字，综合全球指数、A股情绪、板块轮动、资金流向等多维度进行分析',
    '- bullets: 3条，每条 20-45字，分别聚焦:',
    '  1. 全球指数与A股整体表现',
    '  2. 市场情绪与板块特征（如涨跌停、板块轮动等）',
    '  3. 资金动向或成交额分析',
    '- sentiment: 基于数据综合判断，只能是 bullish(偏强)/bearish(承压)/neutral(中性)',
    '',
    '请自主分析数据，不要简单重复数据。重点分析：',
    '- 市场整体情绪是偏强还是偏弱',
    '- 哪些板块是今天的热点，为什么',
    '- 资金流向反映了什么样的市场预期',
    '- 成交额变化是否健康',
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
