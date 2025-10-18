/**
 * Generate a random string
 */
export declare function uid(length?: number): string;
/**
 * Add a name to a function
 */
export declare function withName<T extends (...args: any[]) => any>(fn: T, name: string): T;
type TypeOfReturn = 'undefined' | 'object' | 'boolean' | 'number' | 'bigint' | 'string' | 'symbol' | 'function';
/**
 * Ensure the type of the variable. Otherwise, throw an error.
 */
export declare function ensureType<T>(variable: unknown, type: TypeOfReturn): asserts variable is T;
export {};
//# sourceMappingURL=misc.d.ts.map