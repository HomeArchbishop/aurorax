/**
 * 函数装饰器，使函数只能执行一次
 *
 * @param fn 要装饰的函数
 * @returns 装饰后的函数
 */
export function disposablize(fn) {
    let executed = false;
    return ((...args) => {
        if (executed) {
            throw new Error(`${fn.name}() called multiple times`);
        }
        executed = true;
        return fn(...args);
    });
}
/**
 * 缓存函数，直到条件为真时执行
 *
 * @param condition 条件
 * @param fn 要执行的函数
 */
export function withCacheUntil(condition, fn) {
    const cache = [];
    const excuteCache = () => {
        while (cache.length > 0) {
            cache.shift()?.();
        }
    };
    const interval = setInterval(() => {
        if (!condition()) {
            return;
        }
        excuteCache();
    }, 500);
    return ((...args) => {
        if (!condition()) {
            cache.push(() => fn(...args));
            return;
        }
        clearInterval(interval);
        excuteCache();
        return fn(...args);
    });
}
