/**
 * 函数装饰器，使函数只能执行一次
 *
 * @param fn 要装饰的函数
 * @returns 装饰后的函数
 */
export declare function disposablize<T extends (...args: any[]) => any>(fn: T): T;
/**
 * 缓存函数，直到条件为真时执行
 *
 * @param condition 条件
 * @param fn 要执行的函数
 */
export declare function withCacheUntil<T extends (...args: any[]) => any>(condition: () => boolean, fn: T): T;
//# sourceMappingURL=functional.d.ts.map