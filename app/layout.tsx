import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '基金实盘跟踪 - 全球指数 · 热门股票 · 实时基金',
  description: '实时跟踪全球主要股指、热门个股行情及基金净值变动，助力投资决策。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const themeScript = `
    (function() {
      var t = localStorage.getItem('theme');
      if (t === 'light') return;
      document.documentElement.classList.add('dark');
    })();
  `

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
