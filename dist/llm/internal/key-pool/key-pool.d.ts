declare enum KeyStatus {
    OK = "ok",
    BAD = "bad",
    UNKNOWN = "unknown"
}
export interface KeyObject {
    keyIndex: number;
    key: string;
    status: KeyStatus;
}
export declare class KeyPool {
    #private;
    constructor(keys: string[]);
    markValid(keyIndex: number): void;
    markInvalid(keyIndex: number): void;
    getValidKeys(): KeyObject[];
    getKeyStatuses(): KeyObject[];
}
export {};
//# sourceMappingURL=key-pool.d.ts.map