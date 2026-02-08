const DEFAULT_URL = process.env.NEXT_PUBLIC_APP_URL

const isProduction =
  process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_ENV === 'production'

const isStaging =
  process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_ENV === 'staging'

const constructVercelURL = () => {
  return new URL(`https://${process.env.VERCEL_URL}`)
}

const isDevelopment = process.env.NODE_ENV === 'development'

export const getAppUrl = (): URL => {
  try {
    if (isProduction || isStaging) {
      return constructVercelURL()
    }

    if (isDevelopment) {
      return new URL(DEFAULT_URL)
    }

    return new URL(DEFAULT_URL)
  } catch (error) {
    console.error(error)
    return new URL('http://localhost:3000')
  }
}
