interface PresetOptions {
    template: string;
    replaces?: Array<[RegExp, string]>;
}
export declare class Preset {
    #private;
    constructor(options: PresetOptions);
    addReplaceOnce(replace: [RegExp, string]): this;
    get prompt(): string;
    clone(): Preset;
}
export {};
//# sourceMappingURL=preset.d.ts.map