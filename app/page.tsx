import { Metadata } from 'next'
import Header from '@/components/Header'
import LiveDashboard from '@/components/LiveDashboard'

export const metadata: Metadata = {
  title: '基金实盘跟踪 - 全球指数 · 热门股票 · 实时基金',
  description: '实时跟踪全球主要股指、热门个股行情及基金净值变动，助力投资决策。',
}

export default function Home() {
  return (
    <>
      <Header />
      <LiveDashboard />
      <footer className="border-t border-border/50 py-8 mt-4">
        <div className="container text-center text-sm text-muted-foreground space-y-1">
          <p>基金实盘跟踪 · 数据仅供参考，不构成投资建议</p>
          <p className="text-xs">© 2026 Fund Tracker. All rights reserved.</p>
        </div>
      </footer>
    </>
  )
}
