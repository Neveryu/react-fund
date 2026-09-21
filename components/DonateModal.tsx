'use client'

import { createPortal } from 'react-dom'
import { X, Coffee } from 'lucide-react'

// ?v= 用于失效修复前被防盗链 302 污染的历史缓存；后续换图时同步升版本号
export const DONATE_QR_URL = 'https://raw.giteeusercontent.com/NeverYu/cdn/raw/master/zsm.jpg?v=1'

interface DonateModalProps {
  onClose: () => void
}

export default function DonateModal({ onClose }: DonateModalProps) {
  // Header 使用了 backdrop-blur，会产生包含块导致 fixed 定位失效，故用 Portal 挂到 body
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Coffee className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold">请我喝杯咖啡</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center gap-3">
          <img
            src={DONATE_QR_URL}
            alt="捐赠收款二维码"
            referrerPolicy="no-referrer"
            className="h-56 w-56 rounded-lg border border-border bg-white p-2 object-contain"
          />
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            扫码支持「基金实盘跟踪」的开发与维护
            <br />
            扫码可留言你期待的功能
            <br />
            感谢你的鼓励与支持
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
