'use client'

import { Button } from '@worldcoin/mini-apps-ui-kit-react'
import { signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { startSiweAuth } from '../sign-in/utils/start-siwe'

interface SignInProps {
  provider: NodeJS.ProcessEnv['NEXTAUTH_PROVIDER']
  callbackUrl?: string
}

const SignInButtons = ({ provider, callbackUrl = '/' }: SignInProps) => {
  const [test, setTest] = useState(0)

  const test2 = () => {
    setTest(test + 1)
  }

  useEffect(() => {
    console.log('test', test)
    test2()
  }, [])

  const handleSignIn = () => {
    if (provider === 'siwe') {
      return startSiweAuth(callbackUrl)
    }

    return signIn(provider, { callbackUrl })
  }

  return (
    <div className="grid gap-y-4">
      <Button type="button" variant="primary" onClick={handleSignIn}>
        Sign In
      </Button>
    </div>
  )
}

export default SignInButtons
