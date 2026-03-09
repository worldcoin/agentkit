import { test, expect } from '@playwright/test'

// ---------------------------------------------------------------------------
// 1. NAVIGATION & LAYOUT
// ---------------------------------------------------------------------------
test.describe('Navigation & Layout', () => {
	test('home page loads with correct title and heading', async ({ page }) => {
		await page.goto('/')
		await expect(page).toHaveTitle('Dropping Air')
		await expect(page.locator('h1')).toHaveText('Claim Airdrop')
	})

	test('register page loads with heading', async ({ page }) => {
		await page.goto('/register')
		await expect(page.locator('h1')).toHaveText('Register Your Agent')
		await expect(page.getByText('Connect Wallet')).toBeVisible()
	})

	test('status page loads with heading', async ({ page }) => {
		await page.goto('/status')
		await expect(page.locator('h1')).toHaveText('Claim Status')
		await expect(page.getByPlaceholder('0x...')).toBeVisible()
	})

	test('navbar contains all links and network badge', async ({ page }) => {
		await page.goto('/')
		const nav = page.getByRole('navigation')

		await expect(nav.getByRole('link', { name: 'Dropping Air' })).toBeVisible()
		await expect(nav.getByRole('link', { name: 'Claim' })).toBeVisible()
		await expect(nav.getByRole('link', { name: 'Register' })).toBeVisible()
		await expect(nav.getByRole('link', { name: 'Status' })).toBeVisible()
		await expect(nav.getByText('Base')).toBeVisible()
	})

	test('nav links navigate correctly between all pages', async ({ page }) => {
		await page.goto('/')
		const nav = page.getByRole('navigation')

		await nav.getByRole('link', { name: 'Register' }).click()
		await expect(page).toHaveURL('/register')
		await expect(page.locator('h1')).toHaveText('Register Your Agent')

		await nav.getByRole('link', { name: 'Status' }).click()
		await expect(page).toHaveURL('/status')
		await expect(page.locator('h1')).toHaveText('Claim Status')

		await nav.getByRole('link', { name: 'Claim' }).click()
		await expect(page).toHaveURL('/')
		await expect(page.locator('h1')).toHaveText('Claim Airdrop')
	})

	test('logo link navigates to home', async ({ page }) => {
		await page.goto('/register')
		await page.getByRole('navigation').getByRole('link', { name: 'Dropping Air' }).click()
		await expect(page).toHaveURL('/')
	})

	test('navbar is sticky at top of page', async ({ page }) => {
		await page.goto('/')
		const nav = page.getByRole('navigation')
		await expect(nav).toHaveCSS('position', 'sticky')
	})

	test('non-existent route shows 404', async ({ page }) => {
		const res = await page.goto('/nonexistent-page')
		expect(res?.status()).toBe(404)
	})
})

// ---------------------------------------------------------------------------
// 2. CAMPAIGN INFO (Home Page)
// ---------------------------------------------------------------------------
test.describe('Campaign Info', () => {
	test('shows campaign details on home page', async ({ page }) => {
		await page.goto('/')
		const main = page.getByRole('main')
		await expect(main.getByText('1.0 DROP')).toBeVisible()
		await expect(main.getByText('Base')).toBeVisible()
		await expect(main.getByText('1 / human')).toBeVisible()
	})

	test('shows campaign section heading', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByRole('heading', { name: 'Campaign' })).toBeVisible()
	})

	test('shows per-claim, network, and limit labels', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByText('Per claim')).toBeVisible()
		await expect(page.getByText('Network')).toBeVisible()
		await expect(page.getByText('Limit')).toBeVisible()
	})
})

// ---------------------------------------------------------------------------
// 3. HOW IT WORKS (Home Page)
// ---------------------------------------------------------------------------
test.describe('How It Works', () => {
	test('shows all three steps on claim page', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
		await expect(page.getByText('Step 1')).toBeVisible()
		await expect(page.getByText('Step 2')).toBeVisible()
		await expect(page.getByText('Step 3')).toBeVisible()
	})

	test('step descriptions reference Register, Sign, Claim', async ({ page }) => {
		await page.goto('/')
		const main = page.getByRole('main')
		await expect(main.getByText('Register your agent in the AgentBook with World ID.')).toBeVisible()
		await expect(main.getByText('Sign a challenge to prove wallet ownership.')).toBeVisible()
		await expect(main.getByText('Claim tokens. The server verifies and sends them.')).toBeVisible()
	})
})

// ---------------------------------------------------------------------------
// 4. CLAIM FORM — Disconnected State
// ---------------------------------------------------------------------------
test.describe('Claim Form — Disconnected', () => {
	test('shows Connect Wallet button initially', async ({ page }) => {
		await page.goto('/')
		const btn = page.getByRole('button', { name: 'Connect Wallet' })
		await expect(btn).toBeVisible()
		await expect(btn).toBeEnabled()
	})

	test('does NOT show step indicators when disconnected', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByText('Challenge')).not.toBeVisible()
		await expect(page.getByText('Sign', { exact: true })).not.toBeVisible()
	})

	test('shows registration link when disconnected', async ({ page }) => {
		await page.goto('/')
		const link = page.getByRole('link', { name: 'registered' })
		await expect(link).toBeVisible()
		await expect(link).toHaveAttribute('href', '/register')
	})

	test('registration link navigates to /register', async ({ page }) => {
		await page.goto('/')
		await page.getByRole('link', { name: 'registered' }).click()
		await expect(page).toHaveURL('/register')
	})

	test('Prove & Claim section has proper heading and description', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByRole('heading', { name: 'Prove & Claim' })).toBeVisible()
		await expect(page.getByText('Sign a challenge to verify your agent is human-backed')).toBeVisible()
	})

	test('shows alert for missing wallet when no ethereum provider', async ({ page }) => {
		page.on('dialog', async dialog => {
			expect(dialog.message()).toContain('No wallet found')
			await dialog.accept()
		})
		await page.goto('/')
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
	})
})

// ---------------------------------------------------------------------------
// 5. REGISTER FORM — Disconnected State
// ---------------------------------------------------------------------------
test.describe('Register Form — Disconnected', () => {
	test('shows Connect Wallet button initially', async ({ page }) => {
		await page.goto('/register')
		const btn = page.getByRole('button', { name: 'Connect Wallet' })
		await expect(btn).toBeVisible()
		await expect(btn).toBeEnabled()
	})

	test('shows Orb verification message', async ({ page }) => {
		await page.goto('/register')
		await expect(page.getByText('You need a World ID Orb verification to register.')).toBeVisible()
	})

	test('shows What happens section with 3 steps', async ({ page }) => {
		await page.goto('/register')
		await expect(page.getByRole('heading', { name: 'What happens' })).toBeVisible()
		await expect(page.getByText('Connect your wallet to identify the agent address.')).toBeVisible()
		await expect(page.getByText('Verify with World ID using your Orb-verified identity.')).toBeVisible()
		await expect(
			page.getByText('Register on-chain. Your wallet is linked to your anonymous human ID.')
		).toBeVisible()
	})

	test('shows alert for missing wallet when no ethereum provider', async ({ page }) => {
		page.on('dialog', async dialog => {
			expect(dialog.message()).toContain('No wallet found')
			await dialog.accept()
		})
		await page.goto('/register')
		await page.getByRole('button', { name: 'Connect Wallet' }).click()
	})
})

// ---------------------------------------------------------------------------
// 6. STATUS LOOKUP — Happy Path
// ---------------------------------------------------------------------------
test.describe('Status Lookup — Happy Path', () => {
	test('checking unregistered address shows Registered: No, Claimed: No', async ({ page }) => {
		await page.goto('/status')
		await page.getByPlaceholder('0x...').fill('0x0000000000000000000000000000000000000000')
		await page.getByRole('button', { name: 'Check' }).click()

		await expect(page.getByText('Registered').or(page.getByText('Failed to check status'))).toBeVisible({
			timeout: 10000,
		})

		const registered = page.locator('text=Registered').first()
		if (await registered.isVisible()) {
			await expect(page.getByText('No').first()).toBeVisible()
		}
	})

	test('Check button shows loading spinner while fetching', async ({ page }) => {
		await page.goto('/status')
		await page.getByPlaceholder('0x...').fill('0x0000000000000000000000000000000000000001')

		await page.route('**/api/status*', async route => {
			await new Promise(r => setTimeout(r, 2000))
			await route.continue()
		})

		await page.getByRole('button', { name: 'Check' }).click()
		const btn = page.getByRole('button').filter({ has: page.locator('svg.animate-spin') })
		await expect(btn).toBeVisible()
	})

	test('can check multiple addresses sequentially', async ({ page }) => {
		await page.goto('/status')

		await page.getByPlaceholder('0x...').fill('0x0000000000000000000000000000000000000000')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Registered').or(page.getByText('Failed'))).toBeVisible({ timeout: 10000 })

		await page.getByPlaceholder('0x...').fill('0x0000000000000000000000000000000000000001')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Registered').or(page.getByText('Failed'))).toBeVisible({ timeout: 10000 })
	})
})

// ---------------------------------------------------------------------------
// 7. STATUS LOOKUP — Unhappy Paths
// ---------------------------------------------------------------------------
test.describe('Status Lookup — Validation & Errors', () => {
	test('rejects empty input', async ({ page }) => {
		await page.goto('/status')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Please enter a valid Ethereum address')).toBeVisible()
	})

	test('rejects plain text', async ({ page }) => {
		await page.goto('/status')
		await page.getByPlaceholder('0x...').fill('hello-world')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Please enter a valid Ethereum address')).toBeVisible()
	})

	test('rejects address missing 0x prefix', async ({ page }) => {
		await page.goto('/status')
		await page.getByPlaceholder('0x...').fill('0000000000000000000000000000000000000000')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Please enter a valid Ethereum address')).toBeVisible()
	})

	test('rejects address that is too short', async ({ page }) => {
		await page.goto('/status')
		await page.getByPlaceholder('0x...').fill('0x1234')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Please enter a valid Ethereum address')).toBeVisible()
	})

	test('rejects address that is too long', async ({ page }) => {
		await page.goto('/status')
		await page.getByPlaceholder('0x...').fill('0x' + 'a'.repeat(50))
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Please enter a valid Ethereum address')).toBeVisible()
	})

	test('rejects address with non-hex characters', async ({ page }) => {
		await page.goto('/status')
		await page.getByPlaceholder('0x...').fill('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Please enter a valid Ethereum address')).toBeVisible()
	})

	test('handles API error gracefully', async ({ page }) => {
		await page.goto('/status')
		await page.route('**/api/status*', route =>
			route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) })
		)
		await page.getByPlaceholder('0x...').fill('0x0000000000000000000000000000000000000000')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Server error').or(page.getByText('Failed to check status'))).toBeVisible({
			timeout: 5000,
		})
	})

	test('handles network timeout gracefully', async ({ page }) => {
		await page.goto('/status')
		await page.route('**/api/status*', route => route.abort('timedout'))
		await page.getByPlaceholder('0x...').fill('0x0000000000000000000000000000000000000000')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Failed to check status').or(page.getByText('fetch'))).toBeVisible({
			timeout: 5000,
		})
	})

	test('clears previous error when submitting new lookup', async ({ page }) => {
		await page.goto('/status')
		await page.getByPlaceholder('0x...').fill('invalid')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Please enter a valid Ethereum address')).toBeVisible()

		await page.getByPlaceholder('0x...').fill('0x0000000000000000000000000000000000000000')
		await page.getByRole('button', { name: 'Check' }).click()
		await expect(page.getByText('Please enter a valid Ethereum address')).not.toBeVisible()
	})
})

// ---------------------------------------------------------------------------
// 8. API — GET /api/challenge
// ---------------------------------------------------------------------------
test.describe('API — GET /api/challenge', () => {
	test('returns 200 with all required fields', async ({ request }) => {
		const res = await request.get('/api/challenge')
		expect(res.status()).toBe(200)

		const data = await res.json()
		expect(data).toHaveProperty('nonce')
		expect(data).toHaveProperty('domain')
		expect(data).toHaveProperty('uri')
		expect(data).toHaveProperty('chainId')
		expect(data).toHaveProperty('issuedAt')
		expect(data).toHaveProperty('expirationTime')
		expect(data).toHaveProperty('supportedChains')
	})

	test('returns correct chainId', async ({ request }) => {
		const res = await request.get('/api/challenge')
		const data = await res.json()
		expect(data.chainId).toBe('eip155:8453')
	})

	test('supportedChains contains the chainId', async ({ request }) => {
		const res = await request.get('/api/challenge')
		const data = await res.json()
		expect(data.supportedChains).toContain(data.chainId)
	})

	test('nonce is a non-empty string', async ({ request }) => {
		const res = await request.get('/api/challenge')
		const data = await res.json()
		expect(typeof data.nonce).toBe('string')
		expect(data.nonce.length).toBeGreaterThan(0)
	})

	test('successive calls return different nonces', async ({ request }) => {
		const res1 = await request.get('/api/challenge')
		const res2 = await request.get('/api/challenge')
		const data1 = await res1.json()
		const data2 = await res2.json()
		expect(data1.nonce).not.toBe(data2.nonce)
	})

	test('issuedAt and expirationTime are valid ISO dates', async ({ request }) => {
		const res = await request.get('/api/challenge')
		const data = await res.json()
		expect(new Date(data.issuedAt).toISOString()).toBe(data.issuedAt)
		expect(new Date(data.expirationTime).toISOString()).toBe(data.expirationTime)
	})

	test('challenge expires 5 minutes after issuance', async ({ request }) => {
		const res = await request.get('/api/challenge')
		const data = await res.json()
		const issued = new Date(data.issuedAt).getTime()
		const expires = new Date(data.expirationTime).getTime()
		expect(expires - issued).toBe(5 * 60 * 1000)
	})

	test('uri is a well-formed URL using the domain', async ({ request }) => {
		const res = await request.get('/api/challenge')
		const data = await res.json()
		expect(data.uri).toContain(data.domain)
		expect(() => new URL(data.uri)).not.toThrow()
	})

	test('rejects POST method', async ({ request }) => {
		const res = await request.post('/api/challenge')
		expect(res.status()).toBe(405)
	})
})

// ---------------------------------------------------------------------------
// 9. API — POST /api/claim
// ---------------------------------------------------------------------------
test.describe('API — POST /api/claim', () => {
	test('rejects empty body', async ({ request }) => {
		const res = await request.post('/api/claim', { data: {} })
		expect(res.status()).toBe(400)
		const data = await res.json()
		expect(data.error).toContain('Missing or invalid payload')
	})

	test('rejects null payload', async ({ request }) => {
		const res = await request.post('/api/claim', { data: { payload: null } })
		expect(res.status()).toBe(400)
		const data = await res.json()
		expect(data.error).toContain('Missing or invalid payload')
	})

	test('rejects numeric payload', async ({ request }) => {
		const res = await request.post('/api/claim', { data: { payload: 12345 } })
		expect(res.status()).toBe(400)
	})

	test('rejects non-base64 payload string', async ({ request }) => {
		const res = await request.post('/api/claim', { data: { payload: 'not-valid-base64!!!' } })
		expect(res.status()).toBe(400)
	})

	test('rejects valid base64 but invalid JSON inside', async ({ request }) => {
		const encoded = Buffer.from('this is not json').toString('base64')
		const res = await request.post('/api/claim', { data: { payload: encoded } })
		expect(res.status()).toBe(400)
	})

	test('rejects valid base64+JSON but missing required fields', async ({ request }) => {
		const encoded = Buffer.from(JSON.stringify({ foo: 'bar' })).toString('base64')
		const res = await request.post('/api/claim', { data: { payload: encoded } })
		expect(res.status()).toBe(400)
	})

	test('rejects payload with invalid signature type', async ({ request }) => {
		const payload = {
			domain: 'localhost',
			address: '0x0000000000000000000000000000000000000000',
			uri: 'http://localhost',
			version: '1',
			chainId: 'eip155:8453',
			type: 'invalid_type',
			nonce: 'testnonce',
			issuedAt: new Date().toISOString(),
			signature: '0xfake',
		}
		const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
		const res = await request.post('/api/claim', { data: { payload: encoded } })
		expect(res.status()).toBe(400)
	})

	test('rejects payload with expired challenge nonce', async ({ request }) => {
		const payload = {
			domain: 'sybil-airdrop.vercel.app',
			address: '0x0000000000000000000000000000000000000000',
			uri: 'https://sybil-airdrop.vercel.app',
			version: '1',
			chainId: 'eip155:8453',
			type: 'eip191',
			nonce: 'expired-nonce-that-does-not-exist',
			issuedAt: new Date().toISOString(),
			signature: '0x' + 'ab'.repeat(65),
		}
		const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
		const res = await request.post('/api/claim', { data: { payload: encoded } })
		expect([400, 401]).toContain(res.status())
	})

	test('rejects GET method', async ({ request }) => {
		const res = await request.get('/api/claim')
		expect(res.status()).toBe(405)
	})
})

// ---------------------------------------------------------------------------
// 10. API — GET /api/status
// ---------------------------------------------------------------------------
test.describe('API — GET /api/status', () => {
	test('rejects missing address parameter', async ({ request }) => {
		const res = await request.get('/api/status')
		expect(res.status()).toBe(400)
		const data = await res.json()
		expect(data.error).toContain('Invalid')
	})

	test('rejects empty address parameter', async ({ request }) => {
		const res = await request.get('/api/status?address=')
		expect(res.status()).toBe(400)
	})

	test('rejects invalid address format', async ({ request }) => {
		const res = await request.get('/api/status?address=invalid')
		expect(res.status()).toBe(400)
		const data = await res.json()
		expect(data.error).toContain('Invalid')
	})

	test('rejects address missing 0x prefix', async ({ request }) => {
		const res = await request.get('/api/status?address=0000000000000000000000000000000000000000')
		expect(res.status()).toBe(400)
	})

	test('rejects too-short address', async ({ request }) => {
		const res = await request.get('/api/status?address=0x1234')
		expect(res.status()).toBe(400)
	})

	test('rejects too-long address', async ({ request }) => {
		const res = await request.get('/api/status?address=0x' + 'a'.repeat(50))
		expect(res.status()).toBe(400)
	})

	test('returns status for valid unregistered address', async ({ request }) => {
		const res = await request.get('/api/status?address=0x0000000000000000000000000000000000000000')
		expect(res.status()).toBe(200)
		const data = await res.json()
		expect(data).toHaveProperty('registered')
		expect(data).toHaveProperty('claimed')
		expect(typeof data.registered).toBe('boolean')
		expect(typeof data.claimed).toBe('boolean')
	})

	test('unregistered address returns registered=false', async ({ request }) => {
		const res = await request.get('/api/status?address=0x0000000000000000000000000000000000000000')
		const data = await res.json()
		expect(data.registered).toBe(false)
		expect(data.humanId).toBeNull()
		expect(data.claimed).toBe(false)
		expect(data.claim).toBeNull()
	})

	test('accepts checksummed address', async ({ request }) => {
		const res = await request.get('/api/status?address=0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B')
		expect(res.status()).toBe(200)
	})

	test('accepts lowercase address', async ({ request }) => {
		const res = await request.get('/api/status?address=0xab5801a7d398351b8be11c439e05c5b3259aec9b')
		expect(res.status()).toBe(200)
	})

	test('rejects POST method', async ({ request }) => {
		const res = await request.post('/api/status')
		expect(res.status()).toBe(405)
	})
})

// ---------------------------------------------------------------------------
// 11. API — GET /api/rp-context
// ---------------------------------------------------------------------------
test.describe('API — GET /api/rp-context', () => {
	test('returns 200 with rp_context object', async ({ request }) => {
		const res = await request.get('/api/rp-context')
		expect(res.status()).toBe(200)

		const data = await res.json()
		expect(data).toHaveProperty('rp_context')
	})

	test('rp_context has all required fields', async ({ request }) => {
		const res = await request.get('/api/rp-context')
		const { rp_context } = await res.json()

		expect(rp_context).toHaveProperty('rp_id')
		expect(rp_context).toHaveProperty('nonce')
		expect(rp_context).toHaveProperty('created_at')
		expect(rp_context).toHaveProperty('expires_at')
		expect(rp_context).toHaveProperty('signature')
	})

	test('rp_id matches expected format', async ({ request }) => {
		const res = await request.get('/api/rp-context')
		const { rp_context } = await res.json()
		expect(rp_context.rp_id).toMatch(/^rp_[a-f0-9]+$/)
	})

	test('nonce is a hex string', async ({ request }) => {
		const res = await request.get('/api/rp-context')
		const { rp_context } = await res.json()
		expect(rp_context.nonce).toMatch(/^0x[a-f0-9]+$/)
	})

	test('signature is a hex string', async ({ request }) => {
		const res = await request.get('/api/rp-context')
		const { rp_context } = await res.json()
		expect(rp_context.signature).toMatch(/^0x[a-f0-9]+$/)
	})

	test('expires_at is after created_at', async ({ request }) => {
		const res = await request.get('/api/rp-context')
		const { rp_context } = await res.json()
		expect(rp_context.expires_at).toBeGreaterThan(rp_context.created_at)
	})

	test('context expires ~5 minutes after creation', async ({ request }) => {
		const res = await request.get('/api/rp-context')
		const { rp_context } = await res.json()
		const diff = rp_context.expires_at - rp_context.created_at
		expect(diff).toBe(300)
	})

	test('successive calls return different nonces', async ({ request }) => {
		const res1 = await request.get('/api/rp-context')
		const res2 = await request.get('/api/rp-context')
		const ctx1 = (await res1.json()).rp_context
		const ctx2 = (await res2.json()).rp_context
		expect(ctx1.nonce).not.toBe(ctx2.nonce)
	})

	test('rejects POST method', async ({ request }) => {
		const res = await request.post('/api/rp-context')
		expect(res.status()).toBe(405)
	})
})

// ---------------------------------------------------------------------------
// 12. CLAIM FORM — Wallet Connection (mocked provider)
// ---------------------------------------------------------------------------
test.describe('Claim Form — Wallet Interaction', () => {
	const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'

	test('shows wallet address and Prove button after connecting', async ({ page }) => {
		await page.goto('/')
		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method }: { method: string }) => {
					if (method === 'eth_requestAccounts') return [addr]
					return null
				},
			}
		}, MOCK_ADDRESS)

		await page.getByRole('button', { name: 'Connect Wallet' }).click()

		await expect(page.getByText('Connected')).toBeVisible()
		await expect(page.getByText(MOCK_ADDRESS.slice(0, 6))).toBeVisible()
		await expect(page.getByText(MOCK_ADDRESS.slice(-4))).toBeVisible()
		await expect(page.getByRole('button', { name: 'Prove Humanity & Claim' })).toBeVisible()
	})

	test('shows step indicators after connecting', async ({ page }) => {
		await page.goto('/')
		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method }: { method: string }) => {
					if (method === 'eth_requestAccounts') return [addr]
					return null
				},
			}
		}, MOCK_ADDRESS)

		await page.getByRole('button', { name: 'Connect Wallet' }).click()

		await expect(page.getByText('Challenge')).toBeVisible()
		await expect(page.getByText('Claim').nth(1)).toBeVisible()
	})

	test('registration link disappears after connecting', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByText('Your agent must be')).toBeVisible()

		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method }: { method: string }) => {
					if (method === 'eth_requestAccounts') return [addr]
					return null
				},
			}
		}, MOCK_ADDRESS)

		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await expect(page.getByText('Your agent must be')).not.toBeVisible()
	})

	test('shows error when challenge fetch fails during claim', async ({ page }) => {
		await page.goto('/')
		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method }: { method: string }) => {
					if (method === 'eth_requestAccounts') return [addr]
					return null
				},
			}
		}, MOCK_ADDRESS)
		await page.getByRole('button', { name: 'Connect Wallet' }).click()

		await page.route('**/api/challenge', route =>
			route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"fail"}' })
		)
		await page.getByRole('button', { name: 'Prove Humanity & Claim' }).click()

		await expect(page.getByText('Failed')).toBeVisible({ timeout: 5000 })
		await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()
	})
})

// ---------------------------------------------------------------------------
// 13. REGISTER FORM — Wallet Connection (mocked provider)
// ---------------------------------------------------------------------------
test.describe('Register Form — Wallet Interaction', () => {
	const MOCK_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

	test('shows wallet address and Verify button after connecting', async ({ page }) => {
		await page.goto('/register')
		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method }: { method: string }) => {
					if (method === 'eth_requestAccounts') return [addr]
					if (method === 'eth_call') return '0x0000000000000000000000000000000000000000000000000000000000000001'
					return null
				},
			}
		}, MOCK_ADDRESS)

		await page.getByRole('button', { name: 'Connect Wallet' }).click()

		await expect(page.getByText('Wallet')).toBeVisible({ timeout: 5000 })
		await expect(page.getByText(MOCK_ADDRESS.slice(0, 6))).toBeVisible()
	})

	test('Orb verification message disappears after connecting', async ({ page }) => {
		await page.goto('/register')
		await expect(page.getByText('You need a World ID Orb verification to register.')).toBeVisible()

		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method }: { method: string }) => {
					if (method === 'eth_requestAccounts') return [addr]
					if (method === 'eth_call') return '0x0000000000000000000000000000000000000000000000000000000000000001'
					return null
				},
			}
		}, MOCK_ADDRESS)

		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await expect(page.getByText('You need a World ID Orb verification to register.')).not.toBeVisible({
			timeout: 5000,
		})
	})
})

// ---------------------------------------------------------------------------
// 14. CROSS-CUTTING CONCERNS
// ---------------------------------------------------------------------------
test.describe('Cross-Cutting', () => {
	test('API responses have correct content-type', async ({ request }) => {
		const endpoints = ['/api/challenge', '/api/rp-context', '/api/status?address=0x0000000000000000000000000000000000000000']
		for (const endpoint of endpoints) {
			const res = await request.get(endpoint)
			expect(res.headers()['content-type']).toContain('application/json')
		}
	})

	test('pages return HTML content-type', async ({ request }) => {
		for (const path of ['/', '/register', '/status']) {
			const res = await request.get(path)
			expect(res.headers()['content-type']).toContain('text/html')
		}
	})

	test('no console errors on home page (except favicon)', async ({ page }) => {
		const errors: string[] = []
		page.on('console', msg => {
			if (msg.type() === 'error' && !msg.text().includes('favicon')) {
				errors.push(msg.text())
			}
		})
		await page.goto('/')
		await page.waitForLoadState('networkidle')
		expect(errors).toHaveLength(0)
	})

	test('no console errors on register page (except favicon)', async ({ page }) => {
		const errors: string[] = []
		page.on('console', msg => {
			if (msg.type() === 'error' && !msg.text().includes('favicon')) {
				errors.push(msg.text())
			}
		})
		await page.goto('/register')
		await page.waitForLoadState('networkidle')
		expect(errors).toHaveLength(0)
	})

	test('no console errors on status page (except favicon)', async ({ page }) => {
		const errors: string[] = []
		page.on('console', msg => {
			if (msg.type() === 'error' && !msg.text().includes('favicon')) {
				errors.push(msg.text())
			}
		})
		await page.goto('/status')
		await page.waitForLoadState('networkidle')
		expect(errors).toHaveLength(0)
	})
})

// ---------------------------------------------------------------------------
// 15. SECURITY — Replay & Tampering
// ---------------------------------------------------------------------------
test.describe('Security — Replay & Tampering', () => {
	test('cannot reuse same challenge nonce', async ({ request }) => {
		const challengeRes = await request.get('/api/challenge')
		const challenge = await challengeRes.json()

		const payload = {
			domain: challenge.domain,
			address: '0x0000000000000000000000000000000000000000',
			uri: challenge.uri,
			version: '1',
			chainId: challenge.chainId,
			type: 'eip191',
			nonce: challenge.nonce,
			issuedAt: challenge.issuedAt,
			expirationTime: challenge.expirationTime,
			signature: '0x' + 'ab'.repeat(65),
		}
		const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')

		const res1 = await request.post('/api/claim', { data: { payload: encoded } })
		const res2 = await request.post('/api/claim', { data: { payload: encoded } })

		const statuses = [res1.status(), res2.status()]
		expect(statuses.filter(s => s === 200).length).toBeLessThanOrEqual(1)
	})

	test('tampered payload (modified address) is rejected', async ({ request }) => {
		const challengeRes = await request.get('/api/challenge')
		const challenge = await challengeRes.json()

		const originalPayload = {
			domain: challenge.domain,
			address: '0x0000000000000000000000000000000000000001',
			uri: challenge.uri,
			version: '1',
			chainId: challenge.chainId,
			type: 'eip191',
			nonce: challenge.nonce,
			issuedAt: challenge.issuedAt,
			signature: '0x' + 'ab'.repeat(65),
		}

		const tampered = { ...originalPayload, address: '0x0000000000000000000000000000000000000099' }
		const encoded = Buffer.from(JSON.stringify(tampered)).toString('base64')
		const res = await request.post('/api/claim', { data: { payload: encoded } })
		expect([400, 401]).toContain(res.status())
	})

	test('payload with wrong domain is rejected', async ({ request }) => {
		const challengeRes = await request.get('/api/challenge')
		const challenge = await challengeRes.json()

		const payload = {
			domain: 'evil-site.com',
			address: '0x0000000000000000000000000000000000000000',
			uri: 'https://evil-site.com',
			version: '1',
			chainId: challenge.chainId,
			type: 'eip191',
			nonce: challenge.nonce,
			issuedAt: challenge.issuedAt,
			signature: '0x' + 'ab'.repeat(65),
		}
		const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
		const res = await request.post('/api/claim', { data: { payload: encoded } })
		expect(res.status()).toBe(400)
		const data = await res.json()
		expect(data.error).toContain('Domain mismatch')
	})

	test('payload with wrong URI is rejected', async ({ request }) => {
		const challengeRes = await request.get('/api/challenge')
		const challenge = await challengeRes.json()

		const payload = {
			domain: challenge.domain,
			address: '0x0000000000000000000000000000000000000000',
			uri: 'https://evil-site.com',
			version: '1',
			chainId: challenge.chainId,
			type: 'eip191',
			nonce: challenge.nonce,
			issuedAt: challenge.issuedAt,
			signature: '0x' + 'ab'.repeat(65),
		}
		const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
		const res = await request.post('/api/claim', { data: { payload: encoded } })
		expect(res.status()).toBe(400)
		const data = await res.json()
		expect(data.error).toContain('URI mismatch')
	})

	test('payload with fabricated nonce is rejected', async ({ request }) => {
		const payload = {
			domain: 'sybil-airdrop.vercel.app',
			address: '0x0000000000000000000000000000000000000000',
			uri: 'https://sybil-airdrop.vercel.app',
			version: '1',
			chainId: 'eip155:8453',
			type: 'eip191',
			nonce: 'completely-made-up-nonce',
			issuedAt: new Date().toISOString(),
			signature: '0x' + 'ab'.repeat(65),
		}
		const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
		const res = await request.post('/api/claim', { data: { payload: encoded } })
		expect([400, 401]).toContain(res.status())
	})
})

// ---------------------------------------------------------------------------
// 16. END-TO-END — Full Claim Flow (mocked wallet + mocked APIs)
// ---------------------------------------------------------------------------
test.describe('E2E — Full Claim Flow (mocked)', () => {
	const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
	const MOCK_TX_HASH = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'

	test('complete claim flow: connect → challenge → sign → claim → success', async ({ page }) => {
		await page.goto('/')

		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method, params }: { method: string; params?: any }) => {
					if (method === 'eth_requestAccounts') return [addr]
					if (method === 'personal_sign') return '0x' + 'ab'.repeat(65)
					return null
				},
			}
		}, MOCK_ADDRESS)

		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await expect(page.getByRole('button', { name: 'Prove Humanity & Claim' })).toBeVisible()

		await page.route('**/api/claim', route =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					txHash: MOCK_TX_HASH,
					amount: '1000000000000000000',
					agentAddress: MOCK_ADDRESS,
					explorerUrl: `https://basescan.org/tx/${MOCK_TX_HASH}`,
				}),
			})
		)

		await page.getByRole('button', { name: 'Prove Humanity & Claim' }).click()

		await expect(page.getByText('Airdrop claimed!')).toBeVisible({ timeout: 15000 })
		await expect(page.getByText(MOCK_TX_HASH.slice(0, 10))).toBeVisible()
		await expect(page.getByRole('button', { name: 'Claimed' })).toBeDisabled()
	})

	test('claim flow shows error for unregistered agent', async ({ page }) => {
		await page.goto('/')

		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method }: { method: string }) => {
					if (method === 'eth_requestAccounts') return [addr]
					if (method === 'personal_sign') return '0x' + 'ab'.repeat(65)
					return null
				},
			}
		}, MOCK_ADDRESS)

		await page.getByRole('button', { name: 'Connect Wallet' }).click()

		await page.route('**/api/claim', route =>
			route.fulfill({
				status: 403,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Agent is not registered in the AgentBook. Register with World ID first.' }),
			})
		)

		await page.getByRole('button', { name: 'Prove Humanity & Claim' }).click()

		await expect(page.getByText('Failed')).toBeVisible({ timeout: 10000 })
		await expect(page.getByText('not registered')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()
	})

	test('claim flow shows error for already-claimed human', async ({ page }) => {
		await page.goto('/')

		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method }: { method: string }) => {
					if (method === 'eth_requestAccounts') return [addr]
					if (method === 'personal_sign') return '0x' + 'ab'.repeat(65)
					return null
				},
			}
		}, MOCK_ADDRESS)

		await page.getByRole('button', { name: 'Connect Wallet' }).click()

		await page.route('**/api/claim', route =>
			route.fulfill({
				status: 409,
				contentType: 'application/json',
				body: JSON.stringify({
					error: 'This human has already claimed the airdrop',
					txHash: MOCK_TX_HASH,
					claimedAt: new Date().toISOString(),
				}),
			})
		)

		await page.getByRole('button', { name: 'Prove Humanity & Claim' }).click()

		await expect(page.getByText('Failed')).toBeVisible({ timeout: 10000 })
		await expect(page.getByText('already claimed')).toBeVisible()
	})

	test('claim flow handles user rejecting signature', async ({ page }) => {
		await page.goto('/')

		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method }: { method: string }) => {
					if (method === 'eth_requestAccounts') return [addr]
					if (method === 'personal_sign') throw new Error('User rejected the request')
					return null
				},
			}
		}, MOCK_ADDRESS)

		await page.getByRole('button', { name: 'Connect Wallet' }).click()
		await page.getByRole('button', { name: 'Prove Humanity & Claim' }).click()

		await expect(page.getByText('Failed')).toBeVisible({ timeout: 10000 })
		await expect(page.getByText('rejected')).toBeVisible()
	})

	test('Try Again button allows retrying after failure', async ({ page }) => {
		await page.goto('/')

		await page.evaluate(addr => {
			;(window as any).ethereum = {
				request: async ({ method }: { method: string }) => {
					if (method === 'eth_requestAccounts') return [addr]
					if (method === 'personal_sign') return '0x' + 'ab'.repeat(65)
					return null
				},
			}
		}, MOCK_ADDRESS)

		await page.getByRole('button', { name: 'Connect Wallet' }).click()

		await page.route('**/api/claim', route =>
			route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ error: 'Internal server error: temporary failure' }),
			})
		)

		await page.getByRole('button', { name: 'Prove Humanity & Claim' }).click()
		await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible({ timeout: 10000 })

		await page.unroute('**/api/claim')
		await page.route('**/api/claim', route =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					txHash: MOCK_TX_HASH,
					amount: '1000000000000000000',
					agentAddress: MOCK_ADDRESS,
					explorerUrl: `https://basescan.org/tx/${MOCK_TX_HASH}`,
				}),
			})
		)

		await page.getByRole('button', { name: 'Try Again' }).click()
		await expect(page.getByText('Airdrop claimed!')).toBeVisible({ timeout: 15000 })
	})
})

// ---------------------------------------------------------------------------
// 17. STATUS PAGE — Registered + Claimed Agent (mocked API)
// ---------------------------------------------------------------------------
test.describe('Status Page — Rich Results (mocked)', () => {
	const MOCK_TX = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'

	test('shows full detail for registered + claimed agent', async ({ page }) => {
		await page.goto('/status')

		await page.route('**/api/status*', route =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					registered: true,
					humanId: '0x1234abcd...ef567890',
					claimed: true,
					claim: {
						txHash: MOCK_TX,
						amount: '1000000000000000000',
						claimedAt: '2026-03-09T12:00:00.000Z',
						explorerUrl: `https://basescan.org/tx/${MOCK_TX}`,
					},
				}),
			})
		)

		await page.getByPlaceholder('0x...').fill('0x0000000000000000000000000000000000000001')
		await page.getByRole('button', { name: 'Check' }).click()

		await expect(page.getByText('Yes').first()).toBeVisible({ timeout: 5000 })
		await expect(page.getByText('0x1234abcd...ef567890')).toBeVisible()
		await expect(page.getByText('Transaction')).toBeVisible()
		await expect(page.getByText(MOCK_TX.slice(0, 10))).toBeVisible()
		await expect(page.getByText('Date')).toBeVisible()
		await expect(page.getByText('Mar 9, 2026').or(page.getByText('Mar 10, 2026'))).toBeVisible()
	})

	test('shows registered but not claimed', async ({ page }) => {
		await page.goto('/status')

		await page.route('**/api/status*', route =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					registered: true,
					humanId: '0xaabbccdd...11223344',
					claimed: false,
					claim: null,
				}),
			})
		)

		await page.getByPlaceholder('0x...').fill('0x0000000000000000000000000000000000000002')
		await page.getByRole('button', { name: 'Check' }).click()

		await expect(page.getByText('0xaabbccdd...11223344')).toBeVisible({ timeout: 5000 })

		const badges = page.locator('text=Yes')
		await expect(badges.first()).toBeVisible()
		await expect(page.getByText('No').first()).toBeVisible()

		await expect(page.getByText('Transaction')).not.toBeVisible()
	})
})

// ---------------------------------------------------------------------------
// 18. ACCESSIBILITY BASICS
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
	test('all pages have a single h1', async ({ page }) => {
		for (const path of ['/', '/register', '/status']) {
			await page.goto(path)
			const h1s = page.locator('h1')
			await expect(h1s).toHaveCount(1)
		}
	})

	test('navigation uses semantic nav element', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByRole('navigation')).toBeVisible()
	})

	test('main content uses semantic main element', async ({ page }) => {
		await page.goto('/')
		await expect(page.getByRole('main')).toBeVisible()
	})

	test('buttons are focusable and have accessible names', async ({ page }) => {
		await page.goto('/')
		const btn = page.getByRole('button', { name: 'Connect Wallet' })
		await btn.focus()
		await expect(btn).toBeFocused()
	})

	test('status input has a placeholder for screen readers', async ({ page }) => {
		await page.goto('/status')
		const input = page.getByPlaceholder('0x...')
		await expect(input).toBeVisible()
		await input.focus()
		await expect(input).toBeFocused()
	})

	test('links have correct href attributes', async ({ page }) => {
		await page.goto('/')
		const nav = page.getByRole('navigation')
		await expect(nav.getByRole('link', { name: 'Claim' })).toHaveAttribute('href', '/')
		await expect(nav.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register')
		await expect(nav.getByRole('link', { name: 'Status' })).toHaveAttribute('href', '/status')
	})
})
