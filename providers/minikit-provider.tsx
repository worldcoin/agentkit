'use client'

import { MiniKit } from '@worldcoin/minikit-js'
import { ReactNode, useEffect } from 'react'

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    MiniKit.install()
  }, [])

  return <>{children}</>
}
