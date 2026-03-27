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
  manager: string
  scale: string
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
