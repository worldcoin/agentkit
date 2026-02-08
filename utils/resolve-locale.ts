// https://github.com/amannn/next-intl/blob/main/packages/next-intl/src/middleware/resolveLocale.tsx

import { Locale } from '@/i18n/routing'
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { RequestCookies } from 'next/dist/server/web/spec-extension/cookies'
import { NextRequest, NextResponse } from 'next/server'

export const COOKIE_LOCALE_NAME = 'NEXT_LOCALE'
export const COOKIE_MAX_AGE = 31536000 // 1 year
export const COOKIE_SAME_SITE = 'lax'

function orderLocales(locales: ReadonlyArray<Locale>) {
  // Workaround for https://github.com/formatjs/formatjs/issues/4469
  return locales.slice().sort((a, b) => b.length - a.length)
}

export const getAcceptLanguageLocale = (
  requestHeaders: Headers,
  locales: ReadonlyArray<Locale>,
  defaultLocale: string
) => {
  let locale

  const languages = new Negotiator({
    headers: {
      'accept-language': requestHeaders.get('accept-language') || undefined,
    },
  }).languages()
  try {
    const orderedLocales = orderLocales(locales)

    locale = match(languages, orderedLocales as unknown as Array<string>, defaultLocale)
  } catch {
    // TODO: Handle error
  }

  return locale
}

export const getLocaleFromCookie = (
  requestCookies: RequestCookies,
  locales: ReadonlyArray<Locale>
) => {
  if (requestCookies.has(COOKIE_LOCALE_NAME)) {
    const value = requestCookies.get(COOKIE_LOCALE_NAME)?.value as Locale
    if (value && locales.includes(value)) {
      return value
    }
  }
}

export const syncCookie = (request: NextRequest, response: NextResponse, locale: string) => {
  const hasOutdatedCookie = request.cookies.get(COOKIE_LOCALE_NAME)?.value !== locale
  if (hasOutdatedCookie) {
    response.cookies.set(COOKIE_LOCALE_NAME, locale, {
      path: request.nextUrl.basePath || undefined,
      sameSite: COOKIE_SAME_SITE,
      maxAge: COOKIE_MAX_AGE,
    })
  }
}
