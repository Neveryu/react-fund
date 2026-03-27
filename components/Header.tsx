'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { label: '首页', href: '#', active: true },
  { label: '全球指数', href: '#indices' },
  { label: '热门股票', href: '#stocks' },
  { label: '基金跟踪', href: '#funds' },
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
