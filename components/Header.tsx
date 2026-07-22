'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const REPOSITORY_URL = 'https://github.com/Neveryu/react-fund'

const navItems = [
  { label: '首页', href: '#', active: true },
  { label: '全球指数', href: '#indices' },
  { label: '每日播报', href: '#daily' },
  { label: '热门股票', href: '#stocks' },
  { label: '基金跟踪', href: '#funds' },
  { label: '基金排行', href: '#fund-ranking' },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight">基金实盘</span>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-0.5">
              Fund Tracker
            </p>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                item.active
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            <span>实时行情</span>
          </div>
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="查看 GitHub 代码仓库"
            title="查看 GitHub 代码仓库"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.25.45-2.28 1.2-3.08-.12-.3-.52-1.47.11-3.04 0 0 .97-.31 3.16 1.17A10.96 10.96 0 0 1 12 6.14c.98 0 1.94.13 2.85.38 2.2-1.48 3.17-1.17 3.17-1.17.63 1.57.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.42-2.71 5.38-5.29 5.67.42.36.78 1.06.78 2.14v3.27c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
            </svg>
          </a>
          <ThemeToggle />
          <button
            className="md:hidden p-2 rounded-md hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav className="md:hidden border-t border-border/50 bg-background p-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                'block px-3 py-2.5 text-sm rounded-md transition-colors',
                item.active
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
