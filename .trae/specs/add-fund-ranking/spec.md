# 当日基金涨跌幅排行榜 Spec

## Why
当前项目展示了全球指数、股票行情和基金跟踪，但缺少一个让用户快速了解当日市场上所有基金涨跌幅排名的模块。用户希望能够一目了然地看到哪些基金涨幅最大、哪些跌幅最大，辅助投资决策。

## What Changes
- 新增 `FundRankingData` 类型定义（基金名称、代码、类型、日涨跌幅、净值等）
- 新增 `fetchFundRanking()` API 函数，通过东方财富 API 获取全市场基金涨跌幅排行榜
- 新增 `FundRankingTable` 组件，以表格形式展示基金涨跌幅排行，支持按涨跌幅/净值/代码排序
- 在 `LiveDashboard` 中新增"当日基金涨跌幅排行榜"模块区域

## Impact
- Affected specs: 无（新增功能）
- Affected code:
  - `lib/data.ts` - 新增类型和模拟数据
  - `lib/client-api.ts` - 新增 API 函数
  - `components/FundRankingTable.tsx` - 新增组件
  - `components/LiveDashboard.tsx` - 新增模块区域

## ADDED Requirements

### Requirement: 基金涨跌幅数据
系统应当提供获取全市场基金涨跌幅排行榜数据的能力。

#### Scenario: 获取排行榜数据成功
- **WHEN** 页面加载时调用 `fetchFundRanking()`
- **THEN** 系统通过东方财富 JSONP API 获取全市场基金涨跌幅数据，并按涨跌幅降序排列
- **AND** 返回包含基金名称、代码、类型、最新净值、日涨跌幅、近1周/近1月收益等字段

#### Scenario: 获取排行榜数据失败
- **WHEN** API 请求超时或网络异常
- **THEN** 系统返回空数组，不影响页面其他模块正常显示
- **AND** 控制台输出错误日志

### Requirement: 基金排行榜展示组件
系统应当提供一个表格组件，展示基金涨跌幅排行数据。

#### Scenario: 展示排行表格
- **WHEN** 用户访问"当日基金涨跌幅排行榜"模块
- **THEN** 系统以表格形式展示基金排行，包含列：排名、基金名称/代码、类型、最新净值、日涨幅、近1周、近1月
- **AND** 涨跌幅按颜色区分：涨为绿色，跌为红色

#### Scenario: 排序功能
- **WHEN** 用户点击表头的"日涨幅"、"近1周"或"近1月"列
- **THEN** 表格按照该列数据重新排序，支持升序/降序切换

#### Scenario: 空数据展示
- **WHEN** 排行榜数据为空
- **THEN** 系统显示"暂无基金排行数据"的提示

### Requirement: 导航与布局
系统应当在主面板中添加"当日基金涨跌幅排行榜"模块入口。

#### Scenario: 模块展示
- **WHEN** 用户滚动到基金跟踪模块下方
- **THEN** 系统展示"当日基金涨跌幅排行榜"区域，包含标题、副标题和排行表格
- **AND** 导航栏中增加"基金排行"锚点链接
