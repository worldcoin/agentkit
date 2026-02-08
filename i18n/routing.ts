import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'

export const locales = [
  'en', // English
  'ar', // Arabic
  'ar-001', // Arabic (World)
  'ca', // Catalan
  'zh-CN', // Chinese Simplified
  'zh-TW', // Chinese Traditional
  'fil-PH', // Filipino (Philippines)
  'fr', // French
  'de', // German
  'de-DE', // German (Germany)
  'hi', // Hindi
  'hu-HU', // Hungarian (Hungary)
  'id-ID', // Indonesian (Indonesia)
  'ja', // Japanese
  'ko', // Korean
  'ms', // Malay
  'ms-MY', // Malay (Malaysia)
  'pl', // Polish
  'pt', // Portuguese
  'pt-BR', // Portuguese (Brazil)
  'pt-PT', // Portuguese (Portugal)
  'ro-RO', // Romanian (Romania)
  'es', // Spanish
  'es-419', // Spanish (Latin America)
  'sw', // Swahili
  'tl-PH', // Tagalog (Philippines)
  'uk', // Ukrainian
  'vi-VN', // Vietnamese (Vietnam)
] as const

export type Locale = (typeof locales)[number]

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'en',

  localePrefix: 'never',

  localeCookie: {
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
})

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing)
