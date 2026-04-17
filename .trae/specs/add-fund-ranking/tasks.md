# Tasks
- [x] Task 1: 在 lib/data.ts 中新增 FundRankingData 类型和模拟数据
  - [x] SubTask 1.1: 定义 FundRankingData 接口（name, code, type, nav, dayChange, weekChange, monthChange）
  - [x] SubTask 1.2: 添加 fundRanking 模拟数据数组（约 15-20 条，覆盖涨/跌）
- [x] Task 2: 在 lib/client-api.ts 中新增 fetchFundRanking() API 函数
  - [x] SubTask 2.1: 实现 JSONP 调用东方财富基金排行 API
  - [x] SubTask 2.2: 解析返回数据，映射为 FundRankingData 格式
  - [x] SubTask 2.3: 按日涨跌幅降序排列，处理错误/超时情况
- [x] Task 3: 创建 components/FundRankingTable.tsx 组件
  - [x] SubTask 3.1: 实现表格布局，包含列：排名、名称/代码、类型、净值、日涨幅、近1周、近1月
  - [x] SubTask 3.2: 实现点击表头排序功能（支持升序/降序切换）
  - [x] SubTask 3.3: 添加涨跌颜色区分（涨绿跌红）
  - [x] SubTask 3.4: 处理空数据状态展示
- [x] Task 4: 在 LiveDashboard.tsx 中集成基金排行模块
  - [x] SubTask 4.1: 导入 FundRankingTable 组件和 fundRanking 数据
  - [x] SubTask 4.2: 添加基金排行状态管理和数据获取逻辑
  - [x] SubTask 4.3: 在页面中添加基金排行模块区域（位于基金跟踪下方）
- [x] Task 5: 更新 Header.tsx 导航栏
  - [x] SubTask 5.1: 在导航项中添加"基金排行"锚点链接

# Task Dependencies
- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 1]
- [Task 4] depends on [Task 2, Task 3]
- [Task 5] depends on [Task 4]
