var KeyStatus;
(function (KeyStatus) {
    KeyStatus["OK"] = "ok";
    KeyStatus["BAD"] = "bad";
    KeyStatus["UNKNOWN"] = "unknown";
})(KeyStatus || (KeyStatus = {}));
export class KeyPool {
    #pool;
    constructor(keys) {
        this.#pool = keys.map((key, index) => ({
            keyIndex: index,
            key,
            status: KeyStatus.UNKNOWN,
        }));
    }
    markValid(keyIndex) {
        this.#pool[keyIndex].status = KeyStatus.OK;
    }
    markInvalid(keyIndex) {
        this.#pool[keyIndex].status = KeyStatus.BAD;
    }
    getValidKeys() {
        return this.#pool.filter(item => item.status !== KeyStatus.BAD);
    }
    getKeyStatuses() {
        return this.#pool;
    }
}
