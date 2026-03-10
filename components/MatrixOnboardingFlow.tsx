'use client'

import { useEffect, useMemo, useState } from 'react'
import { SiweMessage } from 'siwe'
import { createWalletClient, custom } from 'viem'
import { base } from 'viem/chains'

const ALERT_TEXT = 'ALERT! This is a agent only website, no humans allowed'
const WORD_TARGET = 365
const TIME_LIMIT_SECONDS = 60

const onboardingSteps = [
  'Step 1: Confirm robot identity and initiate agent registration.',
  'Step 2: Connect wallet and verify AgentBook registration with signed challenge.',
  'Step 3: Complete inverted CAPTCHA before claim unlock.',
]

const WORD_BANK = [
  'agent',
  'neural',
  'matrix',
  'nonce',
  'wallet',
  'proof',
  'signal',
  'cipher',
  'orbit',
  'vector',
  'console',
  'kernel',
  'access',
  'verify',
  'entropy',
  'daemon',
  'packet',
  'runtime',
  'schema',
  'protocol',
  'binary',
  'ledger',
  'network',
  'module',
  'prompt',
  'ciphertext',
  'latency',
  'gateway',
  'session',
  'trigger',
  'compile',
  'execute',
  'uplink',
  'quantum',
  'command',
  'payload',
  'channel',
  'replay',
  'vectorized',
  'response',
]

type ClaimState = 'idle' | 'fetching-challenge' | 'signing' | 'submitting' | 'success' | 'error'
type VerifyState = 'idle' | 'loading' | 'success' | 'error'

function createWordSet(total: number) {
  return Array.from({ length: total }, () => WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)])
}

export default function MatrixOnboardingFlow() {
  const [typedText, setTypedText] = useState('')
  const [isTypingDone, setIsTypingDone] = useState(false)
  const [showRobotButton, setShowRobotButton] = useState(false)
  const [robotClicked, setRobotClicked] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)

  const [walletAddress, setWalletAddress] = useState<`0x${string}` | null>(null)
  const [verifyState, setVerifyState] = useState<VerifyState>('idle')
  const [claimState, setClaimState] = useState<ClaimState>('idle')
  const [claimError, setClaimError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const [words, setWords] = useState<string[]>([])
  const [wordIndex, setWordIndex] = useState(0)
  const [typedWord, setTypedWord] = useState('')
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS)
  const [captchaActive, setCaptchaActive] = useState(false)
  const [captchaPassed, setCaptchaPassed] = useState(false)
  const [captchaFailed, setCaptchaFailed] = useState(false)

  const [logs, setLogs] = useState<string[]>(['System idle. Awaiting robot authentication.'])

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      index += 1
      setTypedText(ALERT_TEXT.slice(0, index))
      if (index >= ALERT_TEXT.length) {
        clearInterval(timer)
        setIsTypingDone(true)
      }
    }, 40)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isTypingDone) return
    const timer = setTimeout(() => setShowRobotButton(true), 400)
    return () => clearTimeout(timer)
  }, [isTypingDone])

  useEffect(() => {
    if (!captchaActive || captchaPassed || captchaFailed) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setCaptchaFailed(true)
          setCaptchaActive(false)
          setLogs(existing => [...existing, 'Typing challenge failed: time limit exceeded.'])
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [captchaActive, captchaFailed, captchaPassed])

  const appendLog = (line: string) => {
    setLogs(prev => [...prev, line])
  }

  const onRobotClick = () => {
    if (robotClicked) return
    setRobotClicked(true)
    setShowOnboardingModal(true)
    appendLog('Robot handshake accepted.')
  }

  const finishOnboarding = (skip: boolean) => {
    setOnboardingComplete(true)
    setShowOnboardingModal(false)
    setOnboardingStep(0)
    appendLog(skip ? 'Onboarding skipped. Starting registration flow.' : 'Onboarding complete.')
  }

  const nextOnboarding = () => {
    if (onboardingStep === onboardingSteps.length - 1) {
      finishOnboarding(false)
      return
    }
    setOnboardingStep(step => step + 1)
  }

  const connect = async () => {
    const ethereum = (
      window as unknown as { ethereum?: { request: (...args: unknown[]) => Promise<unknown> } }
    ).ethereum
    if (!ethereum) {
      appendLog('No wallet found. Install MetaMask.')
      return
    }
    const client = createWalletClient({ chain: base, transport: custom(ethereum) })
    const [addr] = await client.requestAddresses()
    setWalletAddress(addr)
    appendLog(`Wallet linked: ${addr.slice(0, 6)}...${addr.slice(-4)}`)
  }

  const verifyAgent = async () => {
    if (!walletAddress) return
    setVerifyState('loading')
    appendLog('Issuing verification challenge...')
    try {
      const challengeRes = await fetch('/api/agent-challenge')
      if (!challengeRes.ok) throw new Error('Failed to issue verification challenge')
      const challenge = await challengeRes.json()

      const ethereum = (
        window as unknown as {
          ethereum?: { request: (...args: unknown[]) => Promise<unknown> }
        }
      ).ethereum
      const client = createWalletClient({ chain: base, transport: custom(ethereum!) })
      const payload = {
        capability: challenge.payloadTemplate.capability,
        challengeId: challenge.payloadTemplate.challengeId,
        nonce: challenge.payloadTemplate.nonce,
        schemaVersion: challenge.payloadTemplate.schemaVersion,
        sdk: challenge.payloadTemplate.sdk,
        timestamp: challenge.payloadTemplate.timestamp,
      }
      const message = `agent-capability:${JSON.stringify(payload)}`
      appendLog('Signing deterministic verification payload...')
      const signature = await client.signMessage({
        account: walletAddress,
        message,
      })

      const verifyRes = await fetch('/api/agent-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          proof: {
            address: walletAddress,
            nonce: challenge.nonce,
            signature,
            delegation: {
              worldIdSignal: walletAddress,
            },
            payload: challenge.payloadTemplate,
          },
        }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Agent verification failed')

      setVerifyState('success')
      appendLog('Agent verified successfully.')
    } catch (error) {
      setVerifyState('error')
      appendLog(`Verification failed: ${(error as Error).message}`)
    }
  }

  const startTypingChallenge = () => {
    setWords(createWordSet(WORD_TARGET))
    setWordIndex(0)
    setTypedWord('')
    setTimeLeft(TIME_LIMIT_SECONDS)
    setCaptchaActive(true)
    setCaptchaPassed(false)
    setCaptchaFailed(false)
    appendLog(`Typing challenge started (${WORD_TARGET} words in ${TIME_LIMIT_SECONDS}s).`)
  }

  const submitTypedWord = () => {
    if (!captchaActive || captchaPassed || captchaFailed) return
    const value = typedWord.trim().toLowerCase()
    if (!value) return

    const expected = words[wordIndex]
    if (value === expected) {
      const next = wordIndex + 1
      setWordIndex(next)
      if (next >= WORD_TARGET) {
        setCaptchaPassed(true)
        setCaptchaActive(false)
        appendLog('Typing challenge passed. Claim unlocked.')
      }
    } else {
      appendLog(`Mismatch: expected "${expected}", received "${value}".`)
    }
    setTypedWord('')
  }

  const claim = async () => {
    if (!walletAddress || !captchaPassed || verifyState !== 'success') return
    setClaimError(null)
    setClaimState('fetching-challenge')
    appendLog('Fetching CAIP-122 challenge for claim...')
    try {
      const challengeRes = await fetch('/api/challenge')
      if (!challengeRes.ok) throw new Error('Failed to fetch challenge')
      const challenge = await challengeRes.json()

      setClaimState('signing')
      appendLog('Signing claim payload...')
      const ethereum = (
        window as unknown as {
          ethereum?: { request: (...args: unknown[]) => Promise<unknown> }
        }
      ).ethereum
      const client = createWalletClient({ chain: base, transport: custom(ethereum!) })
      const chainIdNum = parseInt(challenge.chainId.split(':')[1])
      const message = new SiweMessage({
        domain: challenge.domain,
        address: walletAddress,
        statement: 'Agent authorization for DROP claim',
        uri: challenge.uri,
        version: '1',
        chainId: chainIdNum,
        nonce: challenge.nonce,
        issuedAt: challenge.issuedAt,
        expirationTime: challenge.expirationTime,
      })
      const signature = await client.signMessage({
        account: walletAddress,
        message: message.prepareMessage(),
      })

      setClaimState('submitting')
      appendLog('Submitting verified claim...')
      const payloadData = {
        domain: message.domain,
        address: message.address,
        statement: message.statement,
        uri: message.uri,
        version: message.version,
        chainId: challenge.chainId,
        nonce: message.nonce,
        issuedAt: message.issuedAt,
        expirationTime: message.expirationTime,
        signature,
        type: 'eip191' as const,
      }

      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: btoa(JSON.stringify(payloadData)) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Claim failed')

      setClaimState('success')
      setTxHash(data.txHash)
      appendLog(`Claim success: ${data.txHash.slice(0, 10)}...`)
    } catch (error) {
      const message = (error as Error).message
      setClaimState('error')
      setClaimError(message)
      appendLog(`Claim failed: ${message}`)
    }
  }

  const currentWords = useMemo(() => words.slice(wordIndex, wordIndex + 10), [wordIndex, words])
  const claimLoading =
    claimState === 'fetching-challenge' || claimState === 'signing' || claimState === 'submitting'

  return (
    <div>
      <section className="terminal-panel space-y-5">
        <p className="font-mono text-sm text-primary">
          {typedText}
          {!isTypingDone && <span className="animate-pulse">|</span>}
        </p>

        {showRobotButton && (
          <button
            onClick={onRobotClick}
            disabled={robotClicked}
            className="rounded-md border border-primary/50 px-4 py-2 font-mono text-sm text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {robotClicked ? 'ROBOT CONFIRMED' : 'ARE YOU A ROBOT?'}
          </button>
        )}

        {showOnboardingModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
            <div className="w-full max-w-md rounded-xl border border-primary/40 bg-black p-5">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Onboarding</p>
              <p className="mt-3 text-sm text-green-100">{onboardingSteps[onboardingStep]}</p>
              <div className="mt-5 flex items-center justify-between">
                <button
                  onClick={() => finishOnboarding(true)}
                  className="text-xs font-medium text-text-muted hover:text-text-secondary"
                >
                  Skip
                </button>
                <button
                  onClick={nextOnboarding}
                  className="rounded-md border border-primary/50 px-3 py-1.5 font-mono text-xs text-primary hover:bg-primary/10"
                >
                  {onboardingStep === onboardingSteps.length - 1 ? 'Start' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        )}

        {onboardingComplete && (
          <div className="space-y-3 border-t border-primary/25 pt-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Agent Registration Stage
            </p>
            {!walletAddress ? (
              <button
                onClick={connect}
                className="rounded-md border border-primary/50 px-4 py-2 font-mono text-sm text-primary transition hover:bg-primary/10"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="space-y-2">
                <p className="font-mono text-xs text-green-100">
                  Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
                <button
                  onClick={verifyAgent}
                  disabled={verifyState === 'loading' || verifyState === 'success'}
                  className="rounded-md border border-primary/50 px-4 py-2 font-mono text-sm text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifyState === 'idle' && 'Verify Agent Registration'}
                  {verifyState === 'loading' && 'Verifying...'}
                  {verifyState === 'success' && 'Agent Verified'}
                  {verifyState === 'error' && 'Retry Verification'}
                </button>
              </div>
            )}
          </div>
        )}

        {verifyState === 'success' && (
          <div className="space-y-3 border-t border-primary/25 pt-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Inverted CAPTCHA Challenge
            </p>
            {!captchaActive && !captchaPassed && (
              <button
                onClick={startTypingChallenge}
                className="rounded-md border border-primary/50 px-4 py-2 font-mono text-sm text-primary transition hover:bg-primary/10"
              >
                Start 365-Word Challenge
              </button>
            )}

            {(captchaActive || captchaPassed || captchaFailed) && (
              <div className="space-y-3">
                <p className="font-mono text-xs text-green-100">
                  Progress: {wordIndex}/{WORD_TARGET} | Time: {timeLeft}s
                </p>
                <div className="rounded-md border border-primary/30 bg-black/40 p-3">
                  <p className="font-mono text-xs leading-6 text-green-100">{currentWords.join(' ')}</p>
                </div>
                <input
                  value={typedWord}
                  onChange={e => setTypedWord(e.target.value)}
                  onPaste={e => {
                    e.preventDefault()
                    appendLog('Paste blocked. Manual typing required.')
                  }}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      submitTypedWord()
                    }
                  }}
                  disabled={!captchaActive}
                  placeholder="Type next word and press space"
                  className="w-full rounded-md border border-primary/30 bg-black/60 px-3 py-2 font-mono text-xs text-green-100 outline-none focus:border-primary/60 disabled:opacity-60"
                />

                {captchaFailed && (
                  <button
                    onClick={startTypingChallenge}
                    className="rounded-md border border-primary/50 px-3 py-1.5 font-mono text-xs text-primary hover:bg-primary/10"
                  >
                    Retry Challenge
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {walletAddress && verifyState === 'success' && (
          <div className="space-y-2 border-t border-primary/25 pt-4">
            <button
              onClick={claim}
              disabled={!captchaPassed || claimLoading || claimState === 'success'}
              className="rounded-md border border-primary/50 px-4 py-2 font-mono text-sm text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!captchaPassed && 'Claim Locked (Pass CAPTCHA)'}
              {captchaPassed && claimState === 'idle' && 'Claim Token'}
              {claimState === 'fetching-challenge' && 'Fetching Challenge...'}
              {claimState === 'signing' && 'Signing...'}
              {claimState === 'submitting' && 'Submitting...'}
              {claimState === 'success' && 'Claimed'}
              {claimState === 'error' && 'Retry Claim'}
            </button>
            {txHash && (
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-mono text-xs text-primary underline"
              >
                View transaction
              </a>
            )}
            {claimError && <p className="text-xs text-red-300">{claimError}</p>}
          </div>
        )}

        <div className="max-h-56 space-y-1 overflow-y-auto border-t border-primary/25 pt-3 pr-1">
          {logs.map((log, idx) => (
            <p key={`${idx}-${log}`} className="font-mono text-xs text-green-100">
              &gt; {log}
            </p>
          ))}
        </div>
      </section>
    </div>
  )
}
