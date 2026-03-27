'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Plus, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { searchFunds, searchStocks } from '@/lib/client-api'

interface SearchResult {
  code: string
  name: string
  extra?: string
  manager?: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'fund' | 'stock'
  existingCodes: string[]
  onAdd: (code: string, meta?: string, manager?: string) => void
  onRemove: (code: string) => void
}

export default function SearchModal({
  isOpen,
  onClose,
  type,
  existingCodes,
  onAdd,
  onRemove,
}: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        if (type === 'fund') {
          const res = await searchFunds(query)
          setResults(res.map((r) => ({ code: r.code, name: r.name, extra: r.type, manager: r.manager })))
        } else {
          const res = await searchStocks(query)
          setResults(res.map((r) => ({ code: r.code, name: r.name, extra: r.market })))
        }
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timerRef.current)
  }, [query, type])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const title = type === 'fund' ? '搜索基金' : '搜索股票'
  const placeholder = type === 'fund' ? '输入基金名称或代码...' : '输入股票名称或代码...'

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-card shadow-2xl animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search input */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring/50 transition-shadow placeholder:text-muted-foreground"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          {results.length > 0 ? (
            <div className="px-2 pb-2 space-y-0.5">
              {results.map((item) => {
                const isAdded = existingCodes.includes(item.code)
                return (
                  <button
                    key={item.code}
                    onClick={() =>
                      isAdded ? onRemove(item.code) : onAdd(item.code, item.extra, item.manager)
                    }
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors',
                      isAdded ? 'bg-primary/10' : 'hover:bg-secondary/50'
                    )}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {item.name}
                        </span>
                        {item.extra && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                            {item.extra}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.code}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
                        isAdded
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary'
                      )}
                    >
                      {isAdded ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : query && !loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              未找到匹配结果
            </div>
          ) : !query ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {type === 'fund' ? '输入关键词搜索基金' : '输入关键词搜索股票'}
            </div>
          ) : null}
        </div>

        {/* Footer with count */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-xs text-muted-foreground">
          <span>
            已添加 {existingCodes.length} 个{type === 'fund' ? '基金' : '股票'}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
