# 每日股市分析功能实现方案

## Context

项目当前是一个纯静态金融看板，提供全球指数、股票行情、基金跟踪等**数据展示**功能，但缺少A股市场的宏观分析视角。用户希望新增"每日股市分析"模块，包含**大盘概况总结**（涨跌家数、涨停跌停、成交额）、**板块热度/资金流向**（行业/概念板块排行、主力资金流向），并整合为一个**综合每日播报页面**。

## 实现方案

### 1. 类型定义 — `lib/data.ts`

新增 4 个接口：

```typescript
// 大盘统计
export interface MarketStatsData {
  advancers: number      // 上涨家数 (f104)
  decliners: number      // 下跌家数 (f105)
  unchanged: number      // 平家数 (f106)
  limitUp: number        // 涨停数量
  limitDown: number      // 跌停数量
  totalTurnover: number  // 两市总成交额(元)
}

// 板块排行
export interface SectorData {
  name: string           // 板块名称 (f14)
  code: string           // 板块代码 (f12)
  changePercent: number  // 涨跌幅 (f3)
  change: number         // 涨跌额 (f4)
  price: number          // 最新价 (f2)
  advancers: number      // 上涨家数 (f104)
  decliners: number      // 下跌家数 (f105)
  leadStock: string      // 领涨股名称 (f128)
  leadStockCode: string  // 领涨股代码 (f140)
}

// 板块资金流向
export interface SectorCapitalFlowData {
  name: string           // 板块名称 (f14)
  code: string           // 板块代码 (f12)
  changePercent: number  // 涨跌幅 (f3)
  mainNetInflow: number  // 主力净流入 (f62)
  mainNetRatio: number   // 主力净占比 (f184)
  superLargeNet: number  // 超大单净流入 (f66)
  largeNet: number       // 大单净流入 (f72)
}

// 聚合容器
export interface DailyAnalysisData {
  marketStats: MarketStatsData | null
  industrySectors: SectorData[]
  conceptSectors: SectorData[]
  capitalFlow: SectorCapitalFlowData[]
}
```

### 2. API 函数 — `lib/client-api.ts`

新增 4 个函数，复用现有 `jsonp()` 函数，遵循现有错误处理模式（try-catch + 空数组/null fallback）：

#### `fetchMarketStats(): Promise<MarketStatsData | null>`
- 涨跌家数: `push2.eastmoney.com/api/qt/ulist.np/get` — `secids=1.000001` + `fields=f104,f105,f106`
- 两市成交额: 同上接口 — `secids=1.000001,0.399001` + `fields=f6` → 两项 f6 相加
- 涨停跌停: 复用 `push2.eastmoney.com/api/qt/clist/get` 获取全A股涨幅排行，过滤 `f3 >= 9.9` 和 `f3 <= -9.9` 的数量（通过 `pz=5000` 获取足够数据量进行统计）
- 内部使用 `Promise.allSettled` 并发，子请求失败对应字段设为 0

#### `fetchSectorRanking(type: 'industry' | 'concept'): Promise<SectorData[]>`
- URL: `push2.eastmoney.com/api/qt/clist/get`
- 参数: `fs=m:90+t:${type === 'industry' ? '2' : '3'}`, `fid=f3`, `pz=10`, `po=1`(降序)
- fields: `f2,f3,f4,f12,f14,f104,f105,f128,f140`
- 错误返回 `[]`

#### `fetchSectorCapitalFlow(): Promise<SectorCapitalFlowData[]>`
- URL: `push2.eastmoney.com/api/qt/clist/get`
- 参数: `fs=m:90+t:2`, `fid=f62`, `pz=10`, `po=1`
- fields: `f12,f14,f2,f3,f62,f184,f66,f72`
- 错误返回 `[]`

#### `fetchDailyAnalysis(): Promise<DailyAnalysisData>`
- 聚合入口，内部 `Promise.allSettled` 并发调用上述 3 个函数（fetchSectorRanking 调用两次）
- 组装返回 `DailyAnalysisData`

### 3. 新增组件

#### `components/MarketOverview.tsx` — 大盘概况
- Props: `{ data: MarketStatsData | null }`
- 布局: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3` 展示 5 个指标卡片：
  - 上涨家数（绿色 `text-success`）
  - 下跌家数（红色 `text-destructive`）
  - 平盘家数（灰色 `text-muted-foreground`）
  - 涨停/跌停（上绿下红组合）
  - 两市成交额（格式化为"万亿/亿"）
- 底部: 涨跌比例横条（`flex` + 百分比宽度 + `bg-success` / `bg-destructive`）
- 空状态: data 为 null 时显示"暂无大盘数据"

#### `components/SectorRankingTable.tsx` — 板块排行表格
- Props: `{ data: SectorData[]; title: string }`
- 表格列: 排名 | 板块名称 | 涨跌幅(可排序) | 上涨/下跌家数 | 领涨股
- 参照 `FundRankingTable.tsx` 的排序模式和样式
- 响应式: 领涨股列 `hidden sm:table-cell`

#### `components/CapitalFlowTable.tsx` — 资金流向表格
- Props: `{ data: SectorCapitalFlowData[] }`
- 表格列: 排名 | 板块名称 | 涨跌幅 | 主力净流入(亿) | 主力净占比 | 超大单 | 大单
- 金额格式化: `(val / 1e8).toFixed(2) + '亿'`，正数绿色负数红色
- 响应式: 超大单/大单列 `hidden lg:table-cell`

#### `components/DailyMarketAnalysis.tsx` — 容器组件
- Props: `{ data: DailyAnalysisData }`
- 结构:
  - 顶部: `MarketOverview` 组件（始终显示）
  - 下方: 三 Tab 切换（复用股票区域的 Tab 按钮样式）
    - "行业板块" → `SectorRankingTable`
    - "概念板块" → `SectorRankingTable`
    - "资金流向" → `CapitalFlowTable`

### 4. LiveDashboard 集成 — `components/LiveDashboard.tsx`

#### State 新增
```typescript
const [dailyAnalysis, setDailyAnalysis] = useState<DailyAnalysisData>({
  marketStats: null, industrySectors: [], conceptSectors: [], capitalFlow: [],
})
```

#### fetchAllData 扩展
在 `Promise.allSettled` 数组末尾追加 `fetchDailyAnalysis()`，结果处理中新增:
```typescript
if (dailyAnalysisRes.status === 'fulfilled') {
  setDailyAnalysis(dailyAnalysisRes.value)
}
```

#### StatCard 区域调整
- `grid-cols-3` → `grid grid-cols-2 sm:grid-cols-4`
- 新增第 4 个 StatCard（图标: `BarChart2`，已导入；label: "每日播报"；href: "#daily"）

#### 新增 Section
插入位置: **全球指数 section 之后、基金跟踪 section 之前**（大盘分析是指数的自然延伸）
```jsx
<section id="daily">
  <SectionHeader title="每日股市分析" subtitle="大盘概况 · 板块热度 · 资金流向" />
  <div className="mt-4">
    <DailyMarketAnalysis data={dailyAnalysis} />
  </div>
</section>
```

### 5. 导航更新 — `components/Header.tsx`

`navItems` 数组新增:
```typescript
{ label: '每日播报', href: '#daily' }
```
插入到 `全球指数` 之后、`热门股票` 之前。

## 修改文件清单

| 文件 | 操作 | 改动点 |
|------|------|--------|
| `lib/data.ts` | 修改 | +4 个接口定义 |
| `lib/client-api.ts` | 修改 | +4 个 API 函数 |
| `components/MarketOverview.tsx` | **新建** | 大盘概况组件 |
| `components/SectorRankingTable.tsx` | **新建** | 板块排行表格 |
| `components/CapitalFlowTable.tsx` | **新建** | 资金流向表格 |
| `components/DailyMarketAnalysis.tsx` | **新建** | 每日分析容器 |
| `components/LiveDashboard.tsx` | 修改 | state/fetch/section/StatCard |
| `components/Header.tsx` | 修改 | navItems +1 项 |

## 验证方案

1. `npm run dev` 启动开发服务器，访问 `http://localhost:3000/react-fund`
2. 验证导航栏出现"每日播报"链接，点击可跳转到对应 section
3. 验证大盘概况区域正确显示涨跌家数、涨停跌停、成交额和涨跌比例条
4. 验证行业板块/概念板块/资金流向三个 Tab 可切换，数据正确加载
5. 验证表格排序功能正常（点击涨跌幅表头切换升降序）
6. 验证深色/浅色主题切换后样式正确
7. 验证移动端响应式布局（隐藏次要列）
8. 等待 30 秒验证自动刷新是否更新每日分析数据
9. `npm run build` 确认静态构建无报错
