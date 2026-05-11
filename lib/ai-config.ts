const STORAGE_KEY = 'react-fund-ai-config'

export interface AiConfig {
  apiKey: string
  model: string
  baseUrl: string
}

const DEFAULT_CONFIG: AiConfig = {
  apiKey: '',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
}

export function getAiConfig(): AiConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_CONFIG }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    const parsed = JSON.parse(raw) as Partial<AiConfig>
    return {
      apiKey: parsed.apiKey || DEFAULT_CONFIG.apiKey,
      model: parsed.model || DEFAULT_CONFIG.model,
      baseUrl: parsed.baseUrl || DEFAULT_CONFIG.baseUrl,
    }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function setAiConfig(config: Partial<AiConfig>): void {
  if (typeof window === 'undefined') return
  const merged = { ...getAiConfig(), ...config }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
}

export function hasAiConfig(): boolean {
  if (typeof window === 'undefined') return false
  const config = getAiConfig()
  return !!config.apiKey.trim()
}
