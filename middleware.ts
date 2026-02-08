import withAuth from 'next-auth/middleware'
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import {
  COOKIE_LOCALE_NAME,
  getAcceptLanguageLocale,
  getLocaleFromCookie,
  syncCookie,
} from './utils/resolve-locale'
import { routes } from './utils/routes'

const publicPages = [routes.home(), routes.signIn()]

const publicPathnameRegex = RegExp(
  `^(/(${routing.locales.join('|')}))?(${publicPages
    .flatMap(p => (p === '/' ? ['', '/'] : p))
    .join('|')})/?$`,
  'i'
)

const isDev = process.env.NODE_ENV === 'development'

const generateCsp = () => {
  const nonce = crypto.randomUUID()

  const csp = [
    { name: 'default-src', values: ["'self'"] },
    {
      name: 'script-src',
      values: ["'self'", `'nonce-${nonce}'`, ...(isDev ? ["'unsafe-eval'"] : [])],
    },
    {
      name: 'font-src',
      values: ["'self'", 'https://mini-apps-ui-kit.world.org'],
    },
    {
      name: 'style-src',
      values: ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-inline'"] : [])],
    },
    {
      name: 'connect-src',
      values: ["'self'", ...(isDev ? ['webpack://*'] : [])],
    },
    {
      name: 'img-src',
      values: ["'self'", 'data:', 'https://mini-apps-ui-kit.world.org'],
    },
  ]

  const cspString = csp
    .map(directive => {
      return `${directive.name} ${directive.values.join(' ')}`
    })
    .join('; ')

  return { csp: cspString, nonce }
}

const prepareRequestSecurityHeaders = (request: NextRequest) => {
  const { csp, nonce } = generateCsp()
  const headers = new Headers(request.headers)
  headers.set('x-nonce', nonce)
  headers.set('content-security-policy', csp)
  return {
    csp,
    request: new NextRequest(request, { headers }),
  }
}

const prepareResponseSecurityHeaders = (response: NextResponse, csp: string) => {
  response.headers.set('content-security-policy', csp)
}

const detectAndSetLocale = async (originalRequest: NextRequest, newRequest: NextRequest) => {
  // by default next-intl gives more priority to the cookie than the accept-language header
  // but, we want to give priority to the accept-language header (basically, it's the user's phone language)
  const acceptLanguageLocale =
    getAcceptLanguageLocale(originalRequest.headers, routing.locales, routing.defaultLocale) ??
    routing.defaultLocale

  const localeFromCookie = getLocaleFromCookie(originalRequest.cookies, routing.locales)

  const isAcceptLanguageLocaleDifferentFromCookie = acceptLanguageLocale !== localeFromCookie

  if (isAcceptLanguageLocaleDifferentFromCookie) {
    // we override the cookie with the detected accept-language header locale
    newRequest.cookies.set(COOKIE_LOCALE_NAME, acceptLanguageLocale)
  }

  return {
    isAcceptLanguageLocaleDifferentFromCookie,
    acceptLanguageLocale,
  }
}

const intlMiddleware = createMiddleware(routing)

const runMidleware = async (req: NextRequest) => {
  const { csp, request } = prepareRequestSecurityHeaders(req)

  const { isAcceptLanguageLocaleDifferentFromCookie, acceptLanguageLocale } =
    await detectAndSetLocale(req, request)

  const response = intlMiddleware(request)

  if (isAcceptLanguageLocaleDifferentFromCookie) {
    syncCookie(req, response, acceptLanguageLocale)
  }

  prepareResponseSecurityHeaders(response, csp)
  return response
}

const authMiddleware = withAuth(async req => await runMidleware(req), {
  callbacks: {
    authorized: ({ token }) => {
      return token != null
    },
  },
  pages: {
    signIn: routes.signIn(),
  },
})

const middleware = async (req: NextRequest) => {
  const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname)

  if (isPublicPage) {
    return await runMidleware(req)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (authMiddleware as any)(req)

    if (
      response?.status === 307 &&
      response.headers.get('location')?.includes('/auth/sign-in')
    ) {
      // For protected pages, we want to store the original URL as the callback URL
      const url = req.nextUrl.clone()
      const callbackUrl = url.pathname + url.search

      // Add the callbackUrl to the sign-in page URL if the user is not authorized
      url.pathname = '/auth/sign-in'
      url.searchParams.set('callbackUrl', callbackUrl)
      return NextResponse.redirect(url)
    }

    return response
  }
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|favicon.ico|.*\\..*).*)'],
}

export default middleware
