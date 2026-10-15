// Node.js 22.6+：node --experimental-strip-types --test tests/turnover-history.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import * as historyHelpers from '../lib/turnover-history.ts'
const { parseDailyIndexBars, mergeTurnoverHistory } = historyHelpers

const line = (date, amount, open = 100, close = 110) =>
  `${date},${open},${close},${Math.max(open, close) + 5},${Math.min(open, close) - 5},999999,${amount}`
const bars = (...lines) => parseDailyIndexBars(lines)

test('解析开收高低，成交额取第七项而不是成交量', () => {
  assert.deepEqual(bars(line('2026-10-12', 123456789))[0], {
    date: '2026-10-12', open: 100, close: 110, high: 115, low: 95, turnover: 123456789,
  })
})

test('跳过异常价格、非法日期和非字符串；排序并按日期去重', () => {
  const result = parseDailyIndexBars([
    line('2026-10-13', 10), null, 123, '错误数据',
    line('2026-02-30', 1), line('2026-13-01', 1),
    '2026-10-15,NaN,110,120,90,1,50',
    '2026-10-15,100,110,105,90,1,50',
    '2026-10-15,0,110,120,0,1,50',
    line('2026-10-12', 20), line('2026-10-13', 30),
  ])
  assert.deepEqual(result.map((bar) => [bar.date, bar.turnover]), [['2026-10-12', 20], ['2026-10-13', 30]])
})

test('缺失、负值和非有限成交额保留 null，真实零值保留 0', () => {
  for (const invalid of ['', '-', 'NaN', 'Infinity', '-10']) {
    assert.equal(bars(line('2026-10-12', invalid))[0].turnover, null)
  }
  assert.equal(bars('2026-10-12,100,110,120,90,100')[0].turnover, null)
  assert.equal(bars(line('2026-10-12', 0))[0].turnover, 0)
})

test('按日期对齐而非下标，缺任一市场不冒充两市总额', () => {
  const sh = bars(line('2026-10-12', 100), line('2026-10-13', 200), line('2026-10-14', 300))
  const sz = bars(line('2026-10-14', 30), line('2026-10-12', 10))
  const result = mergeTurnoverHistory(sh, sh, sz)
  assert.deepEqual(result.map((point) => point.totalTurnover), [110, null, 330])
  assert.equal(result[1].shTurnover, 200)
  assert.equal(result[1].szTurnover, null)
  assert.equal(result[2].turnoverChangePercent, null)
})

test('切换创业板蜡烛时，两市金额不重复叠加创业板金额', () => {
  const sh = bars(line('2026-10-12', 100))
  const sz = bars(line('2026-10-12', 200))
  const cyb = bars(line('2026-10-12', 80, 2000, 2200))
  const point = mergeTurnoverHistory(cyb, sh, sz)[0]
  assert.equal(point.open, 2000)
  assert.equal(point.close, 2200)
  assert.equal(point.totalTurnover, 300)
})

test('指数涨幅相对昨收而不是当天开盘，成交增幅相对前一日合计', () => {
  const sh = bars(line('2026-10-12', 100, 90, 100), line('2026-10-13', 200, 110, 120))
  const sz = bars(line('2026-10-12', 200), line('2026-10-13', 250))
  const result = mergeTurnoverHistory(sh, sh, sz)
  assert.equal(result[0].indexChangePercent, null)
  assert.equal(result[0].turnoverChangePercent, null)
  assert.ok(Math.abs(result[1].indexChangePercent - 20) < 1e-8)
  assert.equal(result[1].turnoverChangePercent, 50)
})

test('空数据、安全零分母以及仅一个交易日', () => {
  assert.deepEqual(mergeTurnoverHistory([], [], []), [])
  const sh = bars(line('2026-10-12', 0), line('2026-10-13', 100))
  const sz = bars(line('2026-10-12', 0), line('2026-10-13', 200))
  assert.equal(mergeTurnoverHistory(sh, sh, sz)[1].turnoverChangePercent, null)
  assert.equal(mergeTurnoverHistory(sh.slice(0, 1), [], [])[0].totalTurnover, null)
})

test('多取一日再截窗口，可保留首个展示日的昨收比较', () => {
  const input = Array.from({ length: 121 }, (_, i) => {
    const date = new Date(Date.UTC(2026, 0, i + 1)).toISOString().slice(0, 10)
    return line(date, i * 100, 100 + i, 101 + i)
  })
  const sh = parseDailyIndexBars(input)
  const result = mergeTurnoverHistory(sh, sh, sh).slice(-120)
  for (const period of [20, 60, 120]) {
    const window = result.slice(-period)
    assert.equal(window.length, period)
    assert.notEqual(window[0].indexChangePercent, null)
  }
})

// 隔离网络与无关 AI 依赖，执行生产代码的 JSONP、缓存和失败处理逻辑。
const require = createRequire(import.meta.url)
const ts = require('typescript')
const apiCode = ts.transpileModule(readFileSync(new URL('../lib/client-api.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText

function createApiHarness() {
  const requests = []
  const scripts = new Set()
  const window = {}
  let mode = 'success'
  let reply = (url) => ({
    rc: 0,
    data: { klines: [line('2026-10-12', url.searchParams.get('secid') === '1.000001' ? 1e8 : 2e8)] },
  })
  const head = {
    appendChild(script) {
      script.parentNode = head
      scripts.add(script)
      const url = new URL(script.src)
      requests.push(url)
      queueMicrotask(() => {
        if (mode === 'error') { script.onerror(new Error('模拟网络错误')); return }
        const callback = url.searchParams.get('cb')
        if (!callback || !window[callback]) { script.onerror(new Error('缺少 cb 回调')); return }
        window[callback](reply(url))
      })
      return script
    },
    removeChild(script) { scripts.delete(script); script.parentNode = null },
  }
  const exports = {}
  vm.runInNewContext(apiCode, {
    exports, window, document: { head, createElement: () => ({}) },
    setTimeout, clearTimeout, console,
    require: (id) => {
      if (id === './turnover-history') return historyHelpers
      if (['./ai-config', './ai-daily-analysis'].includes(id)) return {}
      throw new Error(`意外依赖 ${id}`)
    },
  })
  return {
    fetch: exports.fetchTurnoverHistory, requests, scripts, window,
    fail: () => { mode = 'error' },
    recover: () => { mode = 'success' },
    setReply: (next) => { reply = next },
  }
}

test('日线 JSONP 必须使用 cb；缓存共享两市，创业板只额外请求一次', async () => {
  const api = createApiHarness()
  const first = await api.fetch('sh')
  assert.equal(first.points[0].totalTurnover, 3e8)
  assert.equal(api.requests.length, 2)
  assert.ok(api.requests.every((url) => url.searchParams.has('cb') && !url.searchParams.has('callback')))
  assert.ok(api.requests.every((url) => url.searchParams.get('lmt') === '121' && url.searchParams.get('fqt') === '0'))
  await api.fetch('sz')
  assert.equal(api.requests.length, 2)
  const cyb = await api.fetch('cyb')
  assert.equal(api.requests.length, 3)
  assert.equal(cyb.points[0].totalTurnover, 3e8)
  assert.equal(api.scripts.size, 0)
  assert.equal(Object.keys(api.window).length, 0)
})

test('并发加载去重，手动强制刷新绕过成功缓存', async () => {
  const api = createApiHarness()
  await Promise.all([api.fetch('sh'), api.fetch('sz'), api.fetch('sh')])
  assert.equal(api.requests.length, 2)
  await api.fetch('sh', true)
  assert.equal(api.requests.length, 4)
})

test('网络错误不覆盖成功缓存、清理脚本并允许重试', async () => {
  const api = createApiHarness()
  const initial = await api.fetch('sh')
  api.fail()
  await assert.rejects(api.fetch('sh', true), /JSONP failed/)
  assert.equal(api.scripts.size, 0)
  assert.equal(Object.keys(api.window).length, 0)
  const previous = await api.fetch('sh')
  assert.equal(previous.fetchedAt, initial.fetchedAt)
  assert.equal(previous.points[0].totalTurnover, 3e8)
  api.recover()
  const recovered = await api.fetch('sh', true)
  assert.equal(recovered.points[0].totalTurnover, 3e8)
  assert.equal(api.requests.length, 6)
})

test('空接口结果不缓存，接口业务错误可重试，缺单市日期不伪造总额', async () => {
  const api = createApiHarness()
  api.setReply(() => ({ rc: 0, data: { klines: [] } }))
  assert.equal((await api.fetch('sh')).points.length, 0)
  await api.fetch('sh')
  assert.equal(api.requests.length, 4)
  api.setReply(() => ({ rc: 102, data: null }))
  await assert.rejects(api.fetch('sh', true), /历史日线查询失败/)
  api.setReply((url) => ({ rc: 0, data: { klines: url.searchParams.get('secid') === '1.000001'
    ? [line('2026-10-12', 1e8), line('2026-10-13', 1e8), line('2026-10-14', 1e8)]
    : [line('2026-10-12', 2e8), line('2026-10-14', 2e8)] } }))
  const result = await api.fetch('sh', true)
  assert.deepEqual(Array.from(result.points, (point) => point.totalTurnover), [3e8, null, 3e8])
})
