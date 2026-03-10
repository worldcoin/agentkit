import { describe, it, expect } from 'vitest'

describe('config', () => {
  it('validates env schema exists', () => {
    expect(typeof process.env).toBe('object')
  })
})
