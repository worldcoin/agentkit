import '@worldcoin/mini-apps-ui-kit-react/styles.css'
import type { Viewport } from 'next'
import { PropsWithChildren } from 'react'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: PropsWithChildren) {
  return children
}
