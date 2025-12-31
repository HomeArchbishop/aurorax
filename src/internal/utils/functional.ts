/**
 * 函数装饰器，使函数只能执行一次
 *
 * @param fn 要装饰的函数
 * @returns 装饰后的函数
 */
export function once<T extends (...args: any[]) => any> (fn: T): T {
  let executed = false

  return ((...args: Parameters<T>) => {
    if (executed) {
      throw new Error(`${fn.name}() called multiple times`)
    }
    executed = true
    return fn(...args)
  }) as T
}

/**
 * 函数装饰器，返回一个函数，
 * 装饰后的函数被调用时，如果条件不满足，则将函数调用缓存起来，
 * 直到条件满足时，缓存的函数调用会被依次执行。
 *
 * @param condition 条件
 * @param fn 要执行的函数
 */
export function queueUntil<T extends (...args: any[]) => any> (
  condition: () => boolean,
  fn: T,
): T {
  const cache: Array<() => ReturnType<T>> = []
  const executeCache = () => {
    while (cache.length > 0) { cache.shift()?.() }
  }
  const interval = setInterval(() => {
    if (!condition()) { return }
    clearInterval(interval)
    executeCache()
  }, 500)
  return ((...args: Parameters<T>) => {
    if (!condition()) {
      cache.push(() => fn(...args))
      return
    }
    clearInterval(interval)
    executeCache()
    return fn(...args)
  }) as T
}
