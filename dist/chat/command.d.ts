import type { DBKey } from './share';
import type { LLM } from '../llm';
import type { ApiRequest } from '../interfaces/onebot/req';
import type { ChatMiddleware } from './chat';
import type { Context } from '../interfaces/facade';
import type { OnebotEvent } from '../interfaces/onebot/event';
import type { Db } from '../db';
type CommandPattern = string | RegExp | Array<string | RegExp>;
export interface CommandCallbackCtx extends Context<OnebotEvent> {
    db: Db;
    dbKey: DBKey;
    llm?: LLM;
    textSegmentRequest: (str: string) => Omit<ApiRequest, 'echo'>;
}
type CommandCallback = (this: ChatMiddleware, ctx: CommandCallbackCtx, args: string[]) => Promise<void>;
interface CommandOptions {
    permission: 'master' | 'everyone' | number[];
}
export interface Command {
    command: RegExp[];
    permission: CommandOptions['permission'];
    callback: CommandCallback;
}
export type CommandRegistrar = (command: Command) => ChatMiddleware;
export type CommandRegistry = Array<Command>;
/**
 * @internal
 * Used in `ChatMiddleware` to create a command registrar function
 * @param commandRegistry - The command registry to register the command to
 * @returns A command registrar function
 */
export declare function createCommandRegistrar(this: ChatMiddleware, commandRegistry: CommandRegistry): CommandRegistrar;
/**
 * Util function to create a command
 * @param command - The command to create
 * @param cb - The callback function
 * @param options - The options for the command
 * @returns A command
 */
export declare function createCommand(pattern: CommandPattern, cb: CommandCallback, options: CommandOptions): Command;
export {};
//# sourceMappingURL=command.d.ts.map