'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('theme')
    if (stored === 'light') {
      setIsDark(false)
    } else if (stored === 'dark') {
      setIsDark(true)
    } else {
      // Default to dark for financial dashboard
      setIsDark(true)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark, mounted])

  if (!mounted) {
    // Avoid hydration mismatch - render placeholder with same dimensions
    return <div className="h-9 w-9" />
  }

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 bg-secondary/50 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
      aria-label={isDark ? '切换到日间模式' : '切换到夜间模式'}
      title={isDark ? '日间模式' : '夜间模式'}
    >
      <Sun className={`h-4 w-4 absolute transition-all duration-300 ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
      <Moon className={`h-4 w-4 absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
    </button>
  )
}
