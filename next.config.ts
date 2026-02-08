import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const publicAppURL = process.env.NEXT_PUBLIC_APP_URL

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  output: 'standalone',

  experimental: {
    reactCompiler: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mini-apps-ui-kit.world.org',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: publicAppURL,
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
