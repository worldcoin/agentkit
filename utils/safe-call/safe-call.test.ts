import { describe, expect, it } from 'vitest'
import { safeCall } from '.'

const TEST_VALUES = {
  STRING: 'test value' as const,
  ERROR_MESSAGE: 'test error' as const,
  OBJECT: { id: 1, name: 'Test' as const },
  CUSTOM_ERROR: { custom: 'error' as const },
  COMPLEX_ARGS: {
    str: 'string arg' as const,
    num: 42,
    bigInt: BigInt('9007199254740991'),
    arr: [1, 'two', { three: 3 }] as const,
    obj: { nested: { value: true } },
    mixed: ['mix', 1, BigInt('1')] as const,
  } as const,
} as const

describe('safeCall', () => {
  describe('with sync functions', () => {
    it('handles passing multiple primitive args', () => {
      const add = (a: number, b: number) => a + b
      const result = safeCall(add)(2, 3)

      expect(result).toEqual({
        success: true,
        data: 5,
      })
    })

    describe('argument handling', () => {
      it('handles array arguments', () => {
        const sumArray = (numbers: number[]) => numbers.reduce((a, b) => a + b, 0)
        const result = safeCall(sumArray)([1, 2, 3, 4])

        expect(result).toEqual({
          success: true,
          data: 10,
        })
      })

      it('handles object arguments', () => {
        const processUser = (user: typeof TEST_VALUES.OBJECT) => ({
          ...user,
          processed: true,
        })
        const result = safeCall(processUser)(TEST_VALUES.OBJECT)

        expect(result).toEqual({
          success: true,
          data: { ...TEST_VALUES.OBJECT, processed: true },
        })
      })

      it('handles BigInt arguments', () => {
        const addBigInts = (a: bigint, b: bigint) => a + b
        const result = safeCall(addBigInts)(BigInt(1), BigInt(2))

        expect(result).toEqual({
          success: true,
          data: BigInt(3),
        })
      })

      it('handles mixed type arguments', () => {
        const processComplex = (args: typeof TEST_VALUES.COMPLEX_ARGS) => ({
          processed: true,
          args,
        })
        const result = safeCall(processComplex)(TEST_VALUES.COMPLEX_ARGS)

        expect(result).toEqual({
          success: true,
          data: {
            processed: true,
            args: TEST_VALUES.COMPLEX_ARGS,
          },
        })
      })
    })

    it('handles successful object return', () => {
      const getData = () => TEST_VALUES.OBJECT
      const result = safeCall(getData)()

      expect(result).toEqual({
        success: true,
        data: TEST_VALUES.OBJECT,
      })
    })

    it('handles Error throwing', () => {
      const throwError = () => {
        throw new Error(TEST_VALUES.ERROR_MESSAGE)
      }
      const result = safeCall(throwError)()

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      })
      if (!result.success) {
        expect(result.error.message).toBe(TEST_VALUES.ERROR_MESSAGE)
      }
    })

    it('handles non-Error throwing', () => {
      const throwObject = () => {
        throw TEST_VALUES.CUSTOM_ERROR
      }
      const result = safeCall(throwObject)()

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      })
      if (!result.success) {
        expect(result.error.cause).toEqual(TEST_VALUES.CUSTOM_ERROR)
      }
    })

    it('handles undefined return', () => {
      const returnUndefined = () => undefined
      const result = safeCall(returnUndefined)()

      expect(result).toEqual({
        success: true,
        data: undefined,
      })
    })

    it('handles null return', () => {
      const returnNull = () => null
      const result = safeCall(returnNull)()

      expect(result).toEqual({
        success: true,
        data: null,
      })
    })
  })

  describe('with async functions', () => {
    it('handles nested Promises', async () => {
      const nestedPromise = () => Promise.resolve(Promise.resolve(TEST_VALUES.STRING))
      const result = await safeCall(nestedPromise)()

      expect(result).toEqual({
        success: true,
        data: TEST_VALUES.STRING,
      })
    })

    describe('argument handling', () => {
      it('handles array arguments', async () => {
        const processArray = (arr: number[]) => Promise.resolve(arr.map(x => x * 2))
        const result = await safeCall(processArray)([1, 2, 3])

        expect(result).toEqual({
          success: true,
          data: [2, 4, 6],
        })
      })

      it('handles object arguments', async () => {
        const processUser = (user: typeof TEST_VALUES.OBJECT) =>
          Promise.resolve({ ...user, processed: true })
        const result = await safeCall(processUser)(TEST_VALUES.OBJECT)

        expect(result).toEqual({
          success: true,
          data: { ...TEST_VALUES.OBJECT, processed: true },
        })
      })

      it('handles BigInt arguments', async () => {
        const processBigInt = (n: bigint) => Promise.resolve(n * BigInt(2))
        const result = await safeCall(processBigInt)(BigInt(42))

        expect(result).toEqual({
          success: true,
          data: BigInt(84),
        })
      })

      it('handles mixed type arguments', async () => {
        const processComplex = (args: typeof TEST_VALUES.COMPLEX_ARGS) =>
          Promise.resolve({
            processed: true,
            args,
            async: true,
          })
        const result = await safeCall(processComplex)(TEST_VALUES.COMPLEX_ARGS)

        expect(result).toEqual({
          success: true,
          data: {
            processed: true,
            args: TEST_VALUES.COMPLEX_ARGS,
            async: true,
          },
        })
      })
    })

    it('handles successful object return', async () => {
      const getData = () => Promise.resolve(TEST_VALUES.OBJECT)
      const result = await safeCall(getData)()

      expect(result).toEqual({
        success: true,
        data: TEST_VALUES.OBJECT,
      })
    })

    it('handles Error throwing', async () => {
      const throwError = () => Promise.reject(new Error(TEST_VALUES.ERROR_MESSAGE))
      const result = await safeCall(throwError)()

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      })
      if (!result.success) {
        expect(result.error.message).toBe(TEST_VALUES.ERROR_MESSAGE)
      }
    })

    it('handles non-Error throwing', async () => {
      const throwString = () => Promise.reject(TEST_VALUES.STRING)
      const result = await safeCall(throwString)()

      expect(result).toEqual({
        success: false,
        error: expect.any(Error),
      })
      if (!result.success) {
        expect(result.error.cause).toBe(TEST_VALUES.STRING)
      }
    })

    it('handles undefined return', async () => {
      const asyncUndefined = () => Promise.resolve(undefined)
      const result = await safeCall(asyncUndefined)()

      expect(result).toEqual({
        success: true,
        data: undefined,
      })
    })

    it('handles null return', async () => {
      const returnNull = () => Promise.resolve(null)
      const result = await safeCall(returnNull)()

      expect(result).toEqual({
        success: true,
        data: null,
      })
    })
  })
})
