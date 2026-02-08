import { getAppUrl } from '@/utils/get-app-url'

export const fetchNonce = async (input?: { ssr?: boolean }) => {
  const path = '/api/nonce'
  let url = path

  if (input?.ssr) {
    try {
      url = getAppUrl().toString()
    } catch (error) {
      console.error(error)
    }
  }

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}
