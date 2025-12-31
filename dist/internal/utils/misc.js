/**
 * Generate a random string
 */
export function uid(length = 8) {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
    let str = '';
    while (length--) {
        str += alphabet[Math.random() * alphabet.length | 0];
    }
    return str;
}
/**
 * Add a name to a function
 */
export function withName(fn, name) {
    if (typeof fn !== 'function') {
        throw new Error('fn must be a function');
    }
    Object.defineProperty(fn, 'name', { value: name, configurable: false });
    return fn;
}
/**
 * Ensure the type of the variable. Otherwise, throw an error.
 */
export function ensureType(variable, type) {
    const typeOfVariable = typeof variable;
    if (typeOfVariable !== type) {
        throw new Error(`variable must be a ${type}, but got ${typeOfVariable}`);
    }
}
