/**
 * Generate a random string
 */
export function uid (length: number = 8) {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  let str = ''
  while (length--) {
    str += alphabet[Math.random() * alphabet.length | 0]
  }
  return str
}

/**
 * Add a name to a function
 */
export function withName <T extends (...args: any[]) => any> (fn: T, name: string): T {
  if (typeof fn !== 'function') {
    throw new Error('fn must be a function')
  }
  Object.defineProperty(fn, 'name', { value: name, configurable: false })
  return fn
}

type TypeOfReturn = 'undefined' | 'object' | 'boolean' | 'number' | 'bigint' | 'string' | 'symbol' | 'function'

/**
 * Ensure the type of the variable. Otherwise, throw an error.
 */
export function ensureType <T> (variable: unknown, type: TypeOfReturn): asserts variable is T {
  const typeOfVariable = typeof variable
  if (typeOfVariable !== type) {
    throw new Error(`variable must be a ${type}, but got ${typeOfVariable}`)
  }
}
