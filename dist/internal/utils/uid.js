export function uid(length = 8) {
    const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
    let str = '';
    while (length--) {
        str += alphabet[Math.random() * alphabet.length | 0];
    }
    return str;
}
