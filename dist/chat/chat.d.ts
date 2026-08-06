import { Preset } from './preset.js';
import { type LLM } from '../llm/index.js';
import { type Middleware } from '../interfaces/facade/index.js';
import { type CommandRegistrar } from './command.js';
import { type PresetPreprocessorFn, type ReplyProcessorFn } from './processor.js';
import type { Db } from '../db/index.js';
interface EableGroupOptions {
    rate: number;
    replyOnAt: boolean;
}
interface EablePrivateOptions {
    rate: number;
}
export declare enum ChatMode {
    Normal = 0,
    SingleLineReply = 1
}
type ChatMiddlewareForkedArray = ChatMiddleware[] & {
    buildAll: () => Middleware[];
};
type InstanceMethodTuple<T, Ex = never> = {
    [Name in Exclude<keyof T, Ex>]: T[Name] extends (...args: Array<infer Arg>) => infer Return ? [Name, Arg[], Return] : never;
}[Exclude<keyof T, Ex>];
type ConstructionLogItem = InstanceMethodTuple<ChatMiddleware, 'recordConstructionLog'>;
export declare class ChatMiddleware {
    #private;
    constructor(id: string);
    usePreset(preset: Preset): this;
    useLLM(llm: LLM): this;
    useDb(db: Db): this;
    useMaster(masterId: number): this;
    enableGroup(groupId: number, options?: EableGroupOptions): this;
    enablePrivate(userId: number, options?: EablePrivateOptions): this;
    allowNext(): this;
    useChatMode(mode: ChatMode): this;
    setPresetHistoryInjectionCount(cnt: number): this;
    addPresetPreprocessor(fn: PresetPreprocessorFn): this;
    addReplyProcessor(fn: ReplyProcessorFn): this;
    addCommand(...args: Parameters<CommandRegistrar>): ReturnType<CommandRegistrar>;
    addSuperCommand(...args: Parameters<CommandRegistrar>): ReturnType<CommandRegistrar>;
    fork(): ChatMiddleware;
    fork(handlers: Array<(mw: ChatMiddleware) => ChatMiddleware>): ChatMiddlewareForkedArray;
    recordConstructionLog(logItem: ConstructionLogItem): void;
    get bubble(): this;
    get mw(): Middleware;
    build(): Middleware;
}
export {};
//# sourceMappingURL=chat.d.ts.map