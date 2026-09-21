'use client'

import { useState } from 'react'
import { Coffee } from 'lucide-react'
import DonateModal, { DONATE_QR_URL } from './DonateModal'

export default function DonateCard() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-3.5 rounded-lg border border-border/60 bg-secondary/30 px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <img
          src={DONATE_QR_URL}
          alt="捐赠收款二维码"
          referrerPolicy="no-referrer"
          className="h-14 w-14 rounded-md border border-border bg-white p-1 object-contain"
        />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Coffee className="h-3.5 w-3.5 text-primary" />
            请我喝杯咖啡
            <span className="text-xs font-normal text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">点击放大</span>
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            如果这个项目对你有帮助，欢迎扫码支持
          </span>
        </span>
      </button>
      {open && <DonateModal onClose={() => setOpen(false)} />}
    </>
  )
}
