/**
 * 函数装饰器，使函数只能执行一次
 *
 * @param fn 要装饰的函数
 * @returns 装饰后的函数
 */
export declare function once<T extends (...args: any[]) => any>(fn: T): T;
/**
 * 函数装饰器，返回一个函数，
 * 装饰后的函数被调用时，如果条件不满足，则将函数调用缓存起来，
 * 直到条件满足时，缓存的函数调用会被依次执行。
 *
 * @param condition 条件
 * @param fn 要执行的函数
 */
export declare function queueUntil<T extends (...args: any[]) => any>(condition: () => boolean, fn: T): T;
//# sourceMappingURL=functional.d.ts.map