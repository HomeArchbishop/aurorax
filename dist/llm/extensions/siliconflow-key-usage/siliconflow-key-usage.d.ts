interface LlmUsage {
    keyIndex: number;
    key: string;
    balance: number;
    unit: string;
    balanceStr: string;
}
export declare class SiliconflowKeyUsage {
    #private;
    static usage(apiHost: string, keys: string[]): Promise<LlmUsage[]>;
}
export {};
//# sourceMappingURL=siliconflow-key-usage.d.ts.map