<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/部署-GitHub_Pages-222?logo=github&logoColor=white" alt="GitHub Pages" />
</p>

<h1 align="center">基金实盘跟踪</h1>

<p align="center">
  <strong>实时金融数据面板 — 全球指数 · 每日播报 · 基金净值 · 板块资金</strong>
</p>

<p align="center">
  <a href="https://neveryu.github.io/react-fund/">在线预览</a> ·
  <a href="./README_EN.md">English</a>
</p>

---

## 预览

### 深色模式

![深色模式](./screenshots/dark-mode.png)

### 浅色模式

![浅色模式](./screenshots/light-mode.png)

---

## 功能特性

### 全球指数
- **9大指数实时行情**
  - 🇨🇳 中国: 上证指数、深证成指、创业板指
  - 🇭🇰 香港: 恒生指数
  - 🇺🇸 美国: 纳斯达克、标普500
  - 🇯🇵 日本: 日经225
  - 🇬🇧 英国: 富时100
  - 🇰🇷 韩国: KOSPI
- **滚动行情条** — 顶部实时滚动显示所有指数
- **K线图表** — 支持日K/周K/月K切换查看

### 每日股市分析
- **大盘概况** — A股涨跌家数、涨停/跌停统计、两市成交额、涨跌比例可视化条
- **行业板块** — 行业板块涨幅排行 Top 10，含领涨股和涨跌家数
- **概念板块** — 概念板块涨幅排行 Top 10
- **资金流向** — 行业板块主力资金净流入排行 Top 10
- **板块热力图** — Treemap 可视化展示板块涨跌分布
- **成交额对比** — 沪/深两市分时成交额对比折线图

### 股票行情
- **热门股票** — 按成交额排名的 A 股 Top 10
- **自选股票** — 搜索添加你关注的股票
- **标签切换** — "热门成交" 与 "我的自选" 一键切换
- **一键移除** — 从自选列表中快速删除

### 基金跟踪
- **基金搜索** — 按名称或代码搜索，数据来自东方财富
- **自选基金** — 构建你的个人基金组合
- **基金详情** — 净值、日涨跌、基金经理、历史收益、持仓信息
- **多时段回报** — 日/周/月/3月/6月/年六个时间维度

### 基金排行榜
- **全市场排行** — 全市场开放式基金按日涨幅排序
- **多维度排序** — 支持日/周/月/3月/6月/年/2年涨幅切换
- **详情查看** — 点击基金查看经理、规模、持仓等详情

### AI 智能分析
- **每日播报** — 基于实时数据自动生成市场摘要
- **情绪判断** — 综合涨跌家数和资金流向分析市场情绪

### 用户体验
- **自动刷新** — 每 30 秒自动更新，支持手动刷新
- **深色/浅色主题** — 一键切换，偏好保存在本地
- **数据持久化** — 自选列表保存在 localStorage，刷新不丢失
- **响应式设计** — 完美适配手机、平板、桌面
- **回到顶部** — 页面滚动后出现快捷按钮
- **纯静态部署** — 无需后端，可部署到 GitHub Pages

---

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16 (静态导出) |
| 语言 | TypeScript 5 |
| UI | React 19 |
| 样式 | Tailwind CSS 3.4 + CSS 变量 |
| 图标 | Lucide React |
| 数据源 | 东方财富 API + 天天基金 API (JSONP) |
| 部署 | GitHub Pages + GitHub Actions |

---

## 快速开始

### 环境要求

- Node.js >= 20
- npm >= 9

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/neveryu/react-fund.git
cd react-fund

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 [http://localhost:3000/react-fund](http://localhost:3000/react-fund)

### 构建

```bash
npm run build
```

静态文件将生成在 `out/` 目录。

---

## 部署

本项目已配置 **GitHub Pages** 自动部署，通过 GitHub Actions 实现。

### 配置步骤

1. 将代码推送到 GitHub 仓库的 `master` 分支
2. 进入仓库 **Settings** > **Pages**
3. 将 **Source** 设置为 **GitHub Actions**
4. 每次推送到 `master` 分支会自动构建部署

部署完成后访问：

```
https://<用户名>.github.io/react-fund/
```

---

## 项目结构

```
react-fund/
├── app/
│   ├── globals.css              # 设计系统 & 主题变量
│   ├── layout.tsx               # 根布局，防止 FOUC
│   └── page.tsx                 # 入口页面
├── components/
│   ├── Header.tsx               # 导航头部
│   ├── LiveDashboard.tsx        # 主面板，数据聚合与状态管理
│   ├── MarketTicker.tsx         # 滚动行情条
│   ├── IndexCard.tsx            # 指数卡片 + 迷你图
│   ├── IndexChartModal.tsx      # 指数 K 线图模态框
│   ├── DailyMarketAnalysis.tsx  # 每日股市分析容器（Tab 切换）
│   ├── MarketOverview.tsx       # 大盘概况（涨跌家数、成交额）
│   ├── SectorRankingTable.tsx   # 板块排行表格（行业/概念）
│   ├── CapitalFlowTable.tsx     # 资金流向表格
│   ├── SectorAnalysis.tsx       # 板块综合分析
│   ├── SectorHeatmap.tsx        # 板块热力图（Treemap）
│   ├── TurnoverComparison.tsx   # 两市成交额对比折线图
│   ├── StockTable.tsx           # 股票表格，支持移除
│   ├── FundCard.tsx             # 基金卡片，支持移除
│   ├── FundRankingTable.tsx     # 基金排行榜
│   ├── FundDetailModal.tsx      # 基金详情弹窗
│   ├── SearchModal.tsx          # 搜索弹窗
│   ├── AiSettingsModal.tsx      # AI 配置弹窗
│   ├── MiniChart.tsx            # SVG 迷你图
│   ├── ScrollToTop.tsx          # 回到顶部按钮
│   ├── ThemeToggle.tsx          # 主题切换按钮
│   └── ui/                      # 基础 UI 组件
├── lib/
│   ├── client-api.ts            # JSONP API 客户端（指数、股票、基金、板块）
│   ├── ai-daily-analysis.ts     # AI 每日分析逻辑
│   ├── ai-config.ts             # AI 配置管理
│   ├── watchlist.ts             # 自选列表状态管理
│   ├── data.ts                  # 类型定义 & 模拟数据
│   └── utils.ts                 # 工具函数
├── .github/workflows/
│   └── deploy.yml               # GitHub Pages 部署配置
├── tailwind.config.ts           # Tailwind 主题配置
├── next.config.mjs              # Next.js 静态导出配置
└── package.json
```

---

## 数据来源

通过 JSONP 实时获取多个数据源：

| 数据类型 | 来源 |
|----------|------|
| 全球指数 | 东方财富 (push2.eastmoney.com) |
| 指数 K 线 | 东方财富 (push2his.eastmoney.com) |
| 股票行情 | 东方财富 (push2.eastmoney.com) |
| 股票搜索 | 东方财富 (searchapi.eastmoney.com) |
| 基金净值 | 天天基金 (fundgz.1234567.com.cn) |
| 基金历史 | 东方财富 (fund.eastmoney.com) |
| 基金排行 | 东方财富 (fund.eastmoney.com) |
| 基金搜索 | 东方财富 (fundsuggest.eastmoney.com) |
| 基金持仓 | 东方财富 (fundf10.eastmoney.com) |
| 板块排行 | 东方财富 (push2.eastmoney.com) |
| 板块资金流向 | 东方财富 (push2.eastmoney.com) |

> **免责声明**：数据仅供参考，不构成投资建议。

---

## 许可证

MIT
