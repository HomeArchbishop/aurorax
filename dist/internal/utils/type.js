export function ensureType(variable, type) {
    const typeOfVariable = typeof variable;
    if (typeOfVariable !== type) {
        throw new Error(`variable must be a ${type}`);
    }
}
