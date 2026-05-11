'use client'

import { useState, useEffect } from 'react'
import { X, Key, Bot, Globe, Save, Trash2 } from 'lucide-react'
import { getAiConfig, setAiConfig, type AiConfig } from '@/lib/ai-config'

export default function AiSettingsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [config, setConfig] = useState<AiConfig>(getAiConfig())

  useEffect(() => {
    if (isOpen) {
      setConfig(getAiConfig())
    }
  }, [isOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSave = () => {
    setAiConfig(config)
    onClose()
  }

  const handleClear = () => {
    setAiConfig({ apiKey: '', model: '', baseUrl: '' })
    setConfig({ apiKey: '', model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' })
    onClose()
  }

  const handleClose = () => {
    setConfig(getAiConfig())
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleClose}
    >
      <div
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Key className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold">AI 分析配置</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-xs text-muted-foreground">
            配置后 AI 将对当日盘面数据做解读。API Key 仅存储在浏览器本地，不会上传到任何服务器。
          </p>

          <div className="space-y-4">
            {/* API Key */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium">
                <Key className="h-3.5 w-3.5 text-primary" />
                API Key
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground">
                支持 OpenAI / 兼容 API 的 Key（如 DeepSeek、Groq 等）
              </p>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium">
                <Bot className="h-3.5 w-3.5 text-primary" />
                模型名称
              </label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="gpt-4o-mini"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Base URL */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium">
                <Globe className="h-3.5 w-3.5 text-primary" />
                API 地址
              </label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[10px] text-muted-foreground">
                使用兼容 OpenAI Chat Completions API
              </p>
            </div>
          </div>

          {/* Preset Hints */}
          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground mb-1">常用模型参考</p>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">
                <span className="font-medium">OpenAI</span>：gpt-4o-mini / gpt-3.5-turbo
              </p>
              <p className="text-[10px] text-muted-foreground">
                <span className="font-medium">DeepSeek</span>：deepseek-chat（baseUrl: https://api.deepseek.com/v1）
              </p>
              <p className="text-[10px] text-muted-foreground">
                <span className="font-medium">Groq</span>：llama-3.3-70b-versatile（baseUrl: https://api.groq.com/openai/v1）
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-border">
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            清除配置
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            保存配置
          </button>
        </div>
      </div>
    </div>
  )
}
