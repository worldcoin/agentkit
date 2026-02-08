import { Page } from '@/components/PageLayout'
import SignInButtons from '@/features/auth/components/SignInButtons'
import { clsx } from '@/utils/clsx'
import { Typography } from '@worldcoin/mini-apps-ui-kit-react'
import { getTranslations } from 'next-intl/server'

interface SignInProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function SignIn({ searchParams }: SignInProps) {
  const sp = await searchParams
  const callbackUrl = sp.callbackUrl
  const t = await getTranslations()

  return (
    <Page>
      <Page.Header className={clsx('flex items-center justify-between p-page')}>
        <Typography as="h1" variant="heading" level={1}>
          {t('SignIn')}
        </Typography>
      </Page.Header>

      <Page.Main className="flex size-full items-center justify-center gap-y-4">
        <SignInButtons provider={process.env.NEXTAUTH_PROVIDER} callbackUrl={callbackUrl} />
      </Page.Main>
    </Page>
  )
}
