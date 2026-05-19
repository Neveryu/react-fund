export interface MarketStatsData {
  advancers: number
  decliners: number
  unchanged: number
  limitUp: number
  limitDown: number
  totalTurnover: number
}

export interface SectorData {
  name: string
  code: string
  changePercent: number
  change: number
  price: number
  advancers: number
  decliners: number
  leadStock: string
  leadStockCode: string
}

export interface SectorCapitalFlowData {
  name: string
  code: string
  changePercent: number
  mainNetInflow: number
  mainNetRatio: number
  superLargeNet: number
  largeNet: number
}

export interface TurnoverTrendPoint {
  time: string      // HH:mm
  turnover: number  // 两市累计成交额（元）
}

export interface TurnoverTrendData {
  today: TurnoverTrendPoint[]       // 今日分时累计成交额
  prev: TurnoverTrendPoint[]        // 上一交易日分时累计成交额
  currentTime: string               // 今日最新时间点 HH:mm
  currentTurnover: number           // 今日最新累计成交额
  prevSameTimeTurnover: number      // 昨日同时点累计成交额
  prevTotalTurnover: number         // 昨日全天成交额
  growthPercent: number             // 相对昨日同时点增长率 %
  shChangePercent: number           // 上证指数今日涨跌幅
  szChangePercent: number           // 深证成指今日涨跌幅
}

export interface HeatmapSector {
  name: string
  code: string
  changePercent: number
  marketCap: number
  stocks: HeatmapStock[]
}

export interface HeatmapStock {
  name: string
  code: string
  changePercent: number
  marketCap: number
}

export interface DailyAnalysisData {
  marketStats: MarketStatsData | null
  industrySectors: SectorData[]
  allIndustrySectors: SectorData[]
  conceptSectors: SectorData[]
  capitalFlow: SectorCapitalFlowData[]
  turnoverTrend: TurnoverTrendData | null
  heatmapData: HeatmapSector[]
}

export interface DailyAiAnalysis {
  title: string
  summary: string
  bullets: string[]
  sentiment: 'bullish' | 'bearish' | 'neutral'
  source: 'ai' | 'rule'
  provider?: string
}

export interface IndexData {
  name: string
  code: string
  value: number
  change: number
  changePercent: number
  sparkline?: number[]
  market: string
  flag: string
}

export interface StockData {
  name: string
  code: string
  price: number
  change: number
  changePercent: number
  volume: string
  turnover: string
  high: number
  low: number
}

export interface FundData {
  name: string
  code: string
  type: string
  nav: number
  navDate: string
  dayChange: number
  manager?: string
  scale?: string
  returns?: {
    oneWeek: number
    oneMonth: number
    threeMonth: number
    sixMonth: number
    oneYear: number
  }
  sparkline?: number[]
}

export const globalIndices: IndexData[] = [
  {
    name: '上证指数',
    code: '000001.SH',
    value: 3342.67,
    change: 18.45,
    changePercent: 0.55,
    market: 'CN',
    flag: '🇨🇳',
    sparkline: [3280, 3295, 3310, 3305, 3318, 3324, 3315, 3330, 3340, 3335, 3342],
  },
  {
    name: '深证成指',
    code: '399001.SZ',
    value: 10856.32,
    change: -42.18,
    changePercent: -0.39,
    market: 'CN',
    flag: '🇨🇳',
    sparkline: [10920, 10900, 10880, 10895, 10870, 10860, 10850, 10865, 10840, 10855, 10856],
  },
  {
    name: '创业板指',
    code: '399006.SZ',
    value: 2156.78,
    change: 12.34,
    changePercent: 0.58,
    market: 'CN',
    flag: '🇨🇳',
    sparkline: [2120, 2130, 2125, 2140, 2135, 2148, 2142, 2150, 2155, 2152, 2157],
  },
  {
    name: '恒生指数',
    code: 'HSI',
    value: 22436.12,
    change: 156.78,
    changePercent: 0.70,
    market: 'HK',
    flag: '🇭🇰',
    sparkline: [22100, 22150, 22200, 22180, 22250, 22300, 22280, 22350, 22400, 22420, 22436],
  },
  {
    name: '纳斯达克',
    code: 'IXIC',
    value: 18234.56,
    change: 245.32,
    changePercent: 1.36,
    market: 'US',
    flag: '🇺🇸',
    sparkline: [17800, 17850, 17900, 17950, 18000, 17980, 18050, 18100, 18150, 18200, 18235],
  },
  {
    name: '标普500',
    code: 'SPX',
    value: 5678.90,
    change: 32.45,
    changePercent: 0.57,
    market: 'US',
    flag: '🇺🇸',
    sparkline: [5600, 5610, 5620, 5630, 5640, 5635, 5650, 5660, 5670, 5675, 5679],
  },
  {
    name: '日经225',
    code: 'N225',
    value: 38567.23,
    change: -123.45,
    changePercent: -0.32,
    market: 'JP',
    flag: '🇯🇵',
    sparkline: [38800, 38750, 38700, 38720, 38680, 38650, 38630, 38600, 38580, 38570, 38567],
  },
  {
    name: '富时100',
    code: 'FTSE',
    value: 8234.56,
    change: 45.67,
    changePercent: 0.56,
    market: 'EU',
    flag: '🇬🇧',
    sparkline: [8150, 8160, 8170, 8180, 8190, 8185, 8200, 8210, 8220, 8230, 8235],
  },
  {
    name: '韩国综合',
    code: 'KS11',
    value: 2567.89,
    change: -12.34,
    changePercent: -0.48,
    market: 'KR',
    flag: '🇰🇷',
    sparkline: [2590, 2585, 2580, 2582, 2578, 2575, 2572, 2570, 2568, 2569, 2568],
  },
]

export const hotStocks: StockData[] = [
  { name: '贵州茅台', code: '600519', price: 1568.00, change: 19.50, changePercent: 1.26, volume: '2.3万手', turnover: '35.8亿', high: 1572.00, low: 1545.00 },
  { name: '宁德时代', code: '300750', price: 218.56, change: -3.24, changePercent: -1.46, volume: '8.5万手', turnover: '18.6亿', high: 223.00, low: 216.80 },
  { name: '比亚迪', code: '002594', price: 285.40, change: 5.80, changePercent: 2.07, volume: '6.2万手', turnover: '17.7亿', high: 287.50, low: 278.90 },
  { name: '腾讯控股', code: '00700', price: 388.60, change: 8.20, changePercent: 2.16, volume: '3.1万手', turnover: '120.3亿', high: 390.00, low: 379.80 },
  { name: '阿里巴巴', code: '09988', price: 85.35, change: -1.15, changePercent: -1.33, volume: '5.8万手', turnover: '49.5亿', high: 87.20, low: 84.80 },
  { name: '中国平安', code: '601318', price: 52.36, change: 0.86, changePercent: 1.67, volume: '12.3万手', turnover: '6.4亿', high: 52.80, low: 51.20 },
  { name: '招商银行', code: '600036', price: 38.25, change: 0.45, changePercent: 1.19, volume: '9.8万手', turnover: '3.8亿', high: 38.50, low: 37.60 },
  { name: '隆基绿能', code: '601012', price: 18.92, change: -0.38, changePercent: -1.97, volume: '15.6万手', turnover: '2.9亿', high: 19.45, low: 18.80 },
]

export interface FundRankingData {
  name: string
  code: string
  type: string
  nav: number
  navDate: string
  dayChange: number
  weekChange: number
  monthChange: number
  threeMonth: number
  sixMonth: number
  oneYear: number
  twoYear: number
  scale?: string
  manager?: string
  holdings?: {
    name: string
    code: string
    percent: number
  }[]
}

export const fundRanking: FundRankingData[] = [
  { name: '招商中证白酒指数', code: '161725', type: '指数型', nav: 1.3456, navDate: '2026-04-16', dayChange: 1.56, weekChange: 2.34, monthChange: 5.67, threeMonth: 8.90, sixMonth: 12.34, oneYear: 18.56, twoYear: 25.2, scale: '456.72亿', manager: '侯昊', holdings: [{ name: '贵州茅台', code: '600519', percent: 15.23 }, { name: '五粮液', code: '000858', percent: 12.45 }, { name: '泸州老窖', code: '000568', percent: 10.87 }, { name: '山西汾酒', code: '600809', percent: 9.65 }, { name: '洋河股份', code: '002304', percent: 8.32 }] },
  { name: '天弘中证科技100', code: '515860', type: 'ETF', nav: 1.1234, navDate: '2026-04-16', dayChange: 2.34, weekChange: 3.45, monthChange: 7.89, threeMonth: 12.34, sixMonth: 18.56, oneYear: 25.67, twoYear: 35.8, scale: '89.34亿', manager: '李宁', holdings: [{ name: '宁德时代', code: '300750', percent: 8.45 }, { name: '比亚迪', code: '002594', percent: 7.23 }, { name: '立讯精密', code: '002475', percent: 6.12 }, { name: '中芯国际', code: '688981', percent: 5.87 }, { name: '科大讯飞', code: '002230', percent: 4.56 }] },
  { name: '易方达消费行业股票', code: '110022', type: '股票型', nav: 4.2567, navDate: '2026-04-16', dayChange: 1.89, weekChange: 2.78, monthChange: 6.23, threeMonth: 10.12, sixMonth: 15.45, oneYear: 22.34, twoYear: 30.5, scale: '234.56亿', manager: '萧楠', holdings: [{ name: '美的集团', code: '000333', percent: 9.87 }, { name: '格力电器', code: '000651', percent: 8.65 }, { name: '海尔智家', code: '600690', percent: 7.23 }, { name: '中国中免', code: '601888', percent: 6.45 }, { name: '伊利股份', code: '600887', percent: 5.67 }] },
  { name: '富国天惠成长混合', code: '161005', type: '混合型', nav: 1.9876, navDate: '2026-04-16', dayChange: 1.23, weekChange: 1.89, monthChange: 4.56, threeMonth: 7.80, sixMonth: 10.23, oneYear: 16.78, twoYear: 22.4, scale: '312.45亿', manager: '朱少醒', holdings: [{ name: '贵州茅台', code: '600519', percent: 9.45 }, { name: '招商银行', code: '600036', percent: 8.23 }, { name: '中国平安', code: '601318', percent: 7.12 }, { name: '宁波银行', code: '002142', percent: 6.34 }, { name: '五粮液', code: '000858', percent: 5.87 }] },
  { name: '广发双擎升级混合', code: '005911', type: '混合型', nav: 2.3456, navDate: '2026-04-16', dayChange: 0.98, weekChange: 1.45, monthChange: 3.78, threeMonth: 6.50, sixMonth: 9.12, oneYear: 14.56, twoYear: 20.1, scale: '156.78亿', manager: '刘格菘', holdings: [{ name: '宁德时代', code: '300750', percent: 11.23 }, { name: '亿纬锂能', code: '300014', percent: 8.76 }, { name: '阳光电源', code: '300274', percent: 7.45 }, { name: '隆基绿能', code: '601012', percent: 6.89 }, { name: '通威股份', code: '600438', percent: 5.67 }] },
  { name: '华夏沪深300ETF联接', code: '000051', type: '指数型', nav: 1.5678, navDate: '2026-04-16', dayChange: 0.67, weekChange: 0.89, monthChange: 2.34, threeMonth: 4.56, sixMonth: 6.78, oneYear: 10.23, twoYear: 14.5, scale: '345.67亿', manager: '张弘弢', holdings: [{ name: '贵州茅台', code: '600519', percent: 5.23 }, { name: '宁德时代', code: '300750', percent: 3.45 }, { name: '招商银行', code: '600036', percent: 2.87 }, { name: '中国平安', code: '601318', percent: 2.34 }, { name: '五粮液', code: '000858', percent: 2.12 }] },
  { name: '易方达蓝筹精选混合', code: '005827', type: '混合型', nav: 1.8234, navDate: '2026-04-16', dayChange: 0.85, weekChange: 1.23, monthChange: 3.45, threeMonth: 5.67, sixMonth: 8.92, oneYear: 12.34, twoYear: 18.2, scale: '576.23亿', manager: '张坤', holdings: [{ name: '腾讯控股', code: '00700', percent: 12.34 }, { name: '贵州茅台', code: '600519', percent: 10.56 }, { name: '五粮液', code: '000858', percent: 9.23 }, { name: '招商银行', code: '600036', percent: 8.45 }, { name: '美团', code: '03690', percent: 7.67 }] },
  { name: '南方中证500ETF联接', code: '160119', type: '指数型', nav: 1.2345, navDate: '2026-04-16', dayChange: 0.45, weekChange: 0.67, monthChange: 1.89, threeMonth: 3.45, sixMonth: 5.12, oneYear: 8.90, twoYear: 12.3, scale: '189.34亿', manager: '孙伟', holdings: [{ name: '晶盛机电', code: '300316', percent: 2.34 }, { name: '中际旭创', code: '300308', percent: 2.12 }, { name: '天孚通信', code: '300394', percent: 1.98 }, { name: '新易盛', code: '300502', percent: 1.87 }, { name: '光威复材', code: '300699', percent: 1.65 }] },
  { name: '嘉实沪深300ETF联接', code: '160706', type: '指数型', nav: 1.4567, navDate: '2026-04-16', dayChange: 0.34, weekChange: 0.56, monthChange: 1.67, threeMonth: 3.12, sixMonth: 4.78, oneYear: 7.80, twoYear: 11.2, scale: '267.89亿', manager: '何如', holdings: [{ name: '贵州茅台', code: '600519', percent: 4.56 }, { name: '宁德时代', code: '300750', percent: 3.23 }, { name: '招商银行', code: '600036', percent: 2.87 }, { name: '中国平安', code: '601318', percent: 2.34 }, { name: '五粮液', code: '000858', percent: 2.12 }] },
  { name: '博时主题行业混合', code: '160505', type: '混合型', nav: 1.6789, navDate: '2026-04-16', dayChange: 0.23, weekChange: 0.45, monthChange: 1.23, threeMonth: 2.56, sixMonth: 4.12, oneYear: 6.78, twoYear: 9.5, scale: '98.45亿', manager: '曾鹏', holdings: [{ name: '长江电力', code: '600900', percent: 8.34 }, { name: '中国核电', code: '601985', percent: 7.23 }, { name: '国投电力', code: '600886', percent: 6.45 }, { name: '华能水电', code: '600025', percent: 5.67 }, { name: '中国神华', code: '601088', percent: 4.89 }] },
  { name: '景顺长城新能源产业', code: '011123', type: '混合型', nav: 0.7654, navDate: '2026-04-16', dayChange: -0.45, weekChange: -0.23, monthChange: -1.56, threeMonth: -5.67, sixMonth: -12.34, oneYear: -23.45, twoYear: -35.2, scale: '123.45亿', manager: '杨锐文', holdings: [{ name: '宁德时代', code: '300750', percent: 9.23 }, { name: '亿纬锂能', code: '300014', percent: 8.45 }, { name: '恩捷股份', code: '002812', percent: 7.12 }, { name: '璞泰来', code: '603659', percent: 6.34 }, { name: '新宙邦', code: '300037', percent: 5.67 }] },
  { name: '中欧医疗健康混合', code: '003095', type: '混合型', nav: 0.9876, navDate: '2026-04-16', dayChange: -1.23, weekChange: -0.56, monthChange: -2.34, threeMonth: -4.56, sixMonth: -8.12, oneYear: -15.67, twoYear: -25.8, scale: '234.56亿', manager: '葛兰', holdings: [{ name: '爱尔眼科', code: '300015', percent: 9.87 }, { name: '药明康德', code: '603259', percent: 8.65 }, { name: '泰格医药', code: '300347', percent: 7.45 }, { name: '恒瑞医药', code: '600276', percent: 6.89 }, { name: '迈瑞医疗', code: '300760', percent: 6.23 }] },
  { name: '隆基绿能主题混合', code: '012345', type: '混合型', nav: 0.8765, navDate: '2026-04-16', dayChange: -1.56, weekChange: -2.34, monthChange: -4.56, threeMonth: -8.90, sixMonth: -15.23, oneYear: -28.45, twoYear: -38.1, scale: '67.89亿', manager: '李杰', holdings: [{ name: '隆基绿能', code: '601012', percent: 12.34 }, { name: '通威股份', code: '600438', percent: 10.23 }, { name: '阳光电源', code: '300274', percent: 9.45 }, { name: '晶澳科技', code: '002459', percent: 8.67 }, { name: '天合光能', code: '688599', percent: 7.89 }] },
  { name: '农银汇理新能源主题', code: '002190', type: '混合型', nav: 1.2345, navDate: '2026-04-16', dayChange: -1.78, weekChange: -2.67, monthChange: -5.23, threeMonth: -8.50, sixMonth: -12.30, oneYear: -25.60, twoYear: -35.2, scale: '87.34亿', manager: '邢军亮', holdings: [{ name: '宁德时代', code: '300750', percent: 11.23 }, { name: '比亚迪', code: '002594', percent: 9.87 }, { name: '亿纬锂能', code: '300014', percent: 8.45 }, { name: '欣旺达', code: '300207', percent: 7.23 }, { name: '国轩高科', code: '002074', percent: 6.56 }] },
  { name: '信达澳银新能源产业', code: '001410', type: '股票型', nav: 1.5678, navDate: '2026-04-16', dayChange: -2.12, weekChange: -3.45, monthChange: -6.78, threeMonth: -10.20, sixMonth: -15.80, oneYear: -28.90, twoYear: -40.1, scale: '45.67亿', manager: '冯明远', holdings: [{ name: '宁德时代', code: '300750', percent: 10.56 }, { name: '亿纬锂能', code: '300014', percent: 9.23 }, { name: '璞泰来', code: '603659', percent: 8.45 }, { name: '恩捷股份', code: '002812', percent: 7.67 }, { name: '星源材质', code: '300568', percent: 6.89 }] },
  { name: '前海开源公用事业', code: '005669', type: '混合型', nav: 1.8901, navDate: '2026-04-16', dayChange: -2.45, weekChange: -3.89, monthChange: -7.23, threeMonth: -11.50, sixMonth: -18.90, oneYear: -32.10, twoYear: -45.3, scale: '156.78亿', manager: '崔宸龙', holdings: [{ name: '比亚迪', code: '002594', percent: 13.45 }, { name: '宁德时代', code: '300750', percent: 11.23 }, { name: '亿纬锂能', code: '300014', percent: 9.87 }, { name: '隆基绿能', code: '601012', percent: 8.65 }, { name: '阳光电源', code: '300274', percent: 7.89 }] },
]

export const funds: FundData[] = [
  {
    name: '易方达蓝筹精选混合',
    code: '005827',
    type: '混合型',
    nav: 1.8234,
    navDate: '2026-03-26',
    dayChange: 0.85,
    manager: '张坤',
    scale: '576.2亿',
    returns: { oneWeek: 1.23, oneMonth: 3.45, threeMonth: 5.67, sixMonth: 8.92, oneYear: 12.34 },
    sparkline: [1.72, 1.74, 1.73, 1.76, 1.75, 1.78, 1.77, 1.80, 1.79, 1.81, 1.82],
  },
  {
    name: '中欧医疗健康混合',
    code: '003095',
    type: '混合型',
    nav: 0.9876,
    navDate: '2026-03-26',
    dayChange: -1.23,
    manager: '葛兰',
    scale: '234.5亿',
    returns: { oneWeek: -0.56, oneMonth: -2.34, threeMonth: -4.56, sixMonth: -8.12, oneYear: -15.67 },
    sparkline: [1.08, 1.06, 1.05, 1.03, 1.02, 1.00, 0.99, 0.98, 0.99, 0.98, 0.99],
  },
  {
    name: '招商中证白酒指数',
    code: '161725',
    type: '指数型',
    nav: 1.3456,
    navDate: '2026-03-26',
    dayChange: 1.56,
    manager: '侯昊',
    scale: '456.7亿',
    returns: { oneWeek: 2.34, oneMonth: 5.67, threeMonth: 8.90, sixMonth: 12.34, oneYear: 18.56 },
    sparkline: [1.20, 1.22, 1.24, 1.23, 1.26, 1.28, 1.30, 1.32, 1.34, 1.33, 1.35],
  },
  {
    name: '天弘中证科技100',
    code: '515860',
    type: 'ETF',
    nav: 1.1234,
    navDate: '2026-03-26',
    dayChange: 2.34,
    manager: '李宁',
    scale: '89.3亿',
    returns: { oneWeek: 3.45, oneMonth: 7.89, threeMonth: 12.34, sixMonth: 18.56, oneYear: 25.67 },
    sparkline: [0.96, 0.98, 1.00, 1.02, 1.01, 1.04, 1.06, 1.08, 1.10, 1.11, 1.12],
  },
  {
    name: '景顺长城新能源产业',
    code: '011123',
    type: '混合型',
    nav: 0.7654,
    navDate: '2026-03-26',
    dayChange: -0.45,
    manager: '杨锐文',
    scale: '123.4亿',
    returns: { oneWeek: -0.23, oneMonth: -1.56, threeMonth: -5.67, sixMonth: -12.34, oneYear: -23.45 },
    sparkline: [0.92, 0.90, 0.88, 0.87, 0.85, 0.84, 0.82, 0.80, 0.78, 0.77, 0.77],
  },
  {
    name: '华夏沪深300ETF联接',
    code: '000051',
    type: '指数型',
    nav: 1.5678,
    navDate: '2026-03-26',
    dayChange: 0.67,
    manager: '张弘弢',
    scale: '345.6亿',
    returns: { oneWeek: 0.89, oneMonth: 2.34, threeMonth: 4.56, sixMonth: 6.78, oneYear: 10.23 },
    sparkline: [1.48, 1.49, 1.50, 1.51, 1.52, 1.51, 1.53, 1.54, 1.55, 1.56, 1.57],
  },
]
