declare namespace NodeJS {
  export interface ProcessEnv {
    NEXT_PUBLIC_APP_URL: string
    NODE_ENV: 'development' | 'production' | 'test'
    NEXT_PUBLIC_APP_ENV: 'development' | 'production' | 'staging'

    // Next Auth
    NEXT_PUBLIC_WLD_CLIENT_ID: string
    WLD_CLIENT_SECRET: string
    NEXTAUTH_SECRET: string

    // Development
    NEXTAUTH_PROVIDER: 'local' | 'worldcoin' | 'siwe'
    MOCK_USER_ADDRESS: `0x${string}`

    // Vercel
    VERCEL_URL: string
  }
}
