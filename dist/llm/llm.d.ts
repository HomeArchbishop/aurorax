import type { LlmPlatform, LlmInputMessage } from './interface.js';
import { type KeyObject } from './internal/key-pool/index.js';
interface LlmOptions {
    platform: LlmPlatform;
    apiHost: string;
    keys: string[];
    model: string;
    temperature?: number;
    topP?: number;
    additionalHeaders?: Record<string, string>;
}
export declare class LLM {
    #private;
    constructor({ platform, apiHost, keys, model, temperature, topP, additionalHeaders, }: LlmOptions);
    getPlatform(): LlmPlatform;
    getKeyStatuses(): KeyObject[];
    completions(messages: LlmInputMessage[]): Promise<string>;
    clone(): LLM;
}
export {};
//# sourceMappingURL=llm.d.ts.map