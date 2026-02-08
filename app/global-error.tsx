'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div>
          <div>Oops</div>
          <button type="button" className="w-full" onClick={reset}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
