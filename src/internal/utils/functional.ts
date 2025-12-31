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
 * 缓存函数，直到条件为真时执行
 *
 * @param condition 条件
 * @param fn 要执行的函数
 */
export function withCacheUntil<T extends (...args: any[]) => any> (
  condition: () => boolean,
  fn: T,
): T {
  const cache: Array<() => ReturnType<T>> = []
  const excuteCache = () => {
    while (cache.length > 0) { cache.shift()?.() }
  }
  const interval = setInterval(() => {
    if (!condition()) { return }
    excuteCache()
  }, 500)
  return ((...args: Parameters<T>) => {
    if (!condition()) {
      cache.push(() => fn(...args))
      return
    }
    clearInterval(interval)
    excuteCache()
    return fn(...args)
  }) as T
}
