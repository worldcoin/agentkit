import { routing } from '@/i18n/routing'
import MiniKitProvider from '@/providers/minikit-provider'
import NextAuthProvider from '@/providers/nextauth-provider'
import { clsx } from '@/utils/clsx'
import '@worldcoin/mini-apps-ui-kit-react/styles.css'
import { Metadata, Viewport } from 'next'
import { hasLocale, Locale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { DM_Mono, Rubik, Sora } from 'next/font/google'
import { notFound } from 'next/navigation'
import { PropsWithChildren } from 'react'

//#region -- Fonts required by UI Kit
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-mono',
})

const rubik = Rubik({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-display',
})
//#endregion

export const metadata: Metadata = {
  title: 'Mini App',
}

export const viewport: Viewport = {
  width: 'device-width, shrink-to-fit=no',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

type RootLayoutProps = Readonly<
  PropsWithChildren<{
    params: Promise<{ locale: Locale }>
  }>
>

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enable static rendering
  setRequestLocale(locale)

  return (
    <html lang={locale}>
      <body className={clsx(dmMono.className, rubik.className, sora.className)}>
        <NextIntlClientProvider>
          <NextAuthProvider>
            <MiniKitProvider>{children}</MiniKitProvider>
          </NextAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
