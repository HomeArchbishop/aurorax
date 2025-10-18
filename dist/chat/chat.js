var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { createMiddleware } from '../app';
import { Preset } from './preset';
import {} from '../interfaces/onebot/req';
import {} from '../llm';
import {} from '../interfaces/facade';
import { createCommandRegistrar, } from './command';
import {} from './processor';
import {} from './share';
export var ChatMode;
(function (ChatMode) {
    ChatMode[ChatMode["Normal"] = 0] = "Normal";
    ChatMode[ChatMode["SingleLineReply"] = 1] = "SingleLineReply";
})(ChatMode || (ChatMode = {}));
function constructionLog(target, propertyName, descriptor) {
    const method = descriptor.value;
    descriptor.value = function (...args) {
        // console.log(`🔗 Chain: ${this._callChain.join(' -> ')}`)
        const result = method.apply(this, args);
        this.recordConstructionLog([propertyName, args, result]);
        return result;
    };
}
export class ChatMiddleware {
    constructor(id) {
        this.#id = id;
    }
    #id;
    #preset = new Preset({ template: '' });
    #enabled = [];
    #allowNext = false;
    #chatMode = ChatMode.Normal;
    #masters = new Set();
    #presetHistoryInjectionCount = 70;
    #presetPreprocessors = [];
    #replyProcessors = [];
    #commands = [];
    #superCommands = [];
    #llm;
    #db;
    #constructionLog = [];
    usePreset(preset) {
        this.#preset = preset.clone();
        return this;
    }
    useLLM(llm) {
        this.#llm = llm;
        return this;
    }
    useDb(db) {
        this.#db = db;
        return this;
    }
    useMaster(masterId) {
        this.#masters.add(masterId);
        return this;
    }
    enableGroup(groupId, options = { rate: 0, replyOnAt: true }) {
        this.#enabled.push({ id: groupId, type: 'group', rate: options.rate, replyOnAt: options.replyOnAt });
        return this;
    }
    enablePrivate(userId, options = { rate: 1 }) {
        this.#enabled.push({ id: userId, type: 'private', rate: options.rate, replyOnAt: true });
        return this;
    }
    allowNext() {
        this.#allowNext = true;
        return this;
    }
    useChatMode(mode) {
        this.#chatMode = mode;
        return this;
    }
    setPresetHistoryInjectionCount(cnt) {
        this.#presetHistoryInjectionCount = cnt;
        return this;
    }
    addPresetPreprocessor(fn) {
        this.#presetPreprocessors.push(fn);
        return this;
    }
    addReplyProcessor(fn) {
        this.#replyProcessors.push(fn);
        return this;
    }
    addCommand(...args) {
        return createCommandRegistrar.call(this, this.#commands)(...args);
    }
    addSuperCommand(...args) {
        return createCommandRegistrar.call(this, this.#superCommands)(...args);
    }
    fork(handlers) {
        const forkOnce = (i) => {
            const newMw = new ChatMiddleware(`${this.#id}_fork_${i}`);
            newMw.#preset = this.#preset.clone();
            newMw.#llm = this.#llm?.clone();
            newMw.#enabled.push(...this.#enabled);
            newMw.#allowNext = this.#allowNext;
            newMw.#chatMode = this.#chatMode;
            newMw.#masters = new Set(this.#masters);
            newMw.#presetHistoryInjectionCount = this.#presetHistoryInjectionCount;
            newMw.#presetPreprocessors.push(...this.#presetPreprocessors);
            newMw.#replyProcessors.push(...this.#replyProcessors);
            newMw.#commands.push(...this.#commands);
            newMw.#superCommands.push(...this.#superCommands);
            newMw.#constructionLog.push(...this.#constructionLog);
            return newMw;
        };
        if (handlers === undefined) {
            return forkOnce(1);
        }
        const arr = handlers.map((handler, i) => handler(forkOnce(i + 1)));
        Object.defineProperty(arr, 'buildAll', {
            value() {
                return this.map((mw) => mw.build());
            },
            writable: false,
            enumerable: false,
            configurable: true,
        });
        return arr;
    }
    recordConstructionLog(logItem) {
        this.#constructionLog.push(logItem);
    }
    get bubble() { return this; }
    get mw() {
        return createMiddleware(async (mwCtx, next) => {
            const { event, send } = mwCtx;
            const db = this.#db ?? (() => { throw new Error('Db is not set'); })();
            if (event.post_type !== 'message') {
                await next();
                return;
            }
            const isBeenAt = event.message.find(seg => seg.type === 'at' && seg.data.qq === `${event.self_id}`) !== undefined;
            const isFromMaster = this.#masters.has(event.user_id);
            const isGroup = event.message_type === 'group';
            const eventId = isGroup ? event.group_id : event.user_id;
            const enableHit = this.#enabled.find(({ id, type }) => id === eventId && type === event.message_type);
            const dbKey = {
                history: `chatbot:${this.#id}:history:${event.message_type}_${eventId}`,
                isShutup: `chatbot:${this.#id}:shutup:${event.message_type}_${eventId}`,
                equipment: `chatbot:${this.#id}:equipment:${event.message_type}_${eventId}`,
            };
            const isShutup = db.getSync(dbKey.isShutup) === 'true';
            // Define tool functions
            const textSegmentRequest = (str) => ({
                action: event.message_type === 'group' ? 'send_group_msg' : 'send_private_msg',
                params: {
                    [event.message_type === 'group' ? 'group_id' : 'user_id']: eventId,
                    message: str,
                },
            });
            const updateHistoryToDb = async (comingMsg, isSelf) => {
                const formerHistory = db.getSync(dbKey.history) ?? '';
                const timenow = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
                const senderNickname = (isGroup ? event.sender.card : event.sender.nickname) ?? 'unknown';
                const updatedHistoryPiece = isSelf
                    ? `(real_you,你,id[${event.self_id}],msgid[unknown],time[${timenow}]): ${comingMsg}`
                    : `(others,nickname[${senderNickname}],id[${event.user_id}],msgid[${event.message_id}],time[${timenow}]): ${comingMsg}`;
                const newHistory = `${formerHistory}\n${updatedHistoryPiece}`;
                await db.put(dbKey.history, newHistory);
                return [formerHistory, updatedHistoryPiece];
            };
            const handleCommands = async (commandRegistry) => {
                const rawMessage = event.raw_message.trim();
                for (const cmd of commandRegistry) {
                    if (!cmd.command.some(reg => reg.test(rawMessage))) {
                        continue;
                    }
                    if (cmd.permission === 'master' && !isFromMaster) {
                        send(textSegmentRequest('没有权限执行该命令'));
                        return true;
                    }
                    else if (Array.isArray(cmd.permission) && !cmd.permission.includes(event.user_id) && !isFromMaster) {
                        send(textSegmentRequest('没有权限执行该命令'));
                        return true;
                    }
                    const ctx = {
                        ...mwCtx,
                        db: this.#db,
                        dbKey,
                        llm: this.#llm,
                        textSegmentRequest,
                    };
                    const args = rawMessage.split(/\s/).slice(1).map(arg => arg.trim()).filter(arg => arg.length > 0);
                    await cmd.callback.call(this, ctx, args);
                    return true;
                }
                return false;
            };
            // Handle super commands
            if (await handleCommands(this.#superCommands)) {
                return;
            }
            // Check if is hit
            if (enableHit === undefined) {
                await next();
                return;
            }
            // Handle Commands
            if (await handleCommands(this.#commands)) {
                return;
            }
            // Save the coming message to db
            const message = event.message.reduce((acc, seg) => {
                if (seg.type === 'text') {
                    acc.push(seg.data.text);
                }
                else if (seg.type === 'at') {
                    acc.push(`@${seg.data.qq}`);
                }
                return acc;
            }, []).join(' ').trim();
            if (message.length === 0) {
                if (this.#allowNext) {
                    await next();
                }
                return;
            }
            const [formerHistory, updatedHistoryPiece] = await updateHistoryToDb(message, false);
            // Check if ignore message this time
            if (isShutup || !((enableHit.replyOnAt && isBeenAt) || (Math.random() < enableHit.rate))) {
                if (this.#allowNext) {
                    await next();
                }
                return;
            }
            // Not ignore, then handle the message
            try {
                if (this.#llm === undefined) {
                    throw new Error('LLM is not set');
                }
                const preset = this.#preset.clone();
                preset.addReplaceOnce([/{{history_injection}}/g,
                    formerHistory.split('\n').slice(-this.#presetHistoryInjectionCount).join('\n')]);
                preset.addReplaceOnce([/{{equipment}}/g, db.getSync(dbKey.equipment) ?? '(no equipment)']);
                for (const preprocessor of this.#presetPreprocessors) {
                    await preprocessor(preset);
                }
                const replyString = await this.#llm.completions([
                    { role: 'system', content: preset.prompt },
                    { role: 'user', content: updatedHistoryPiece },
                ]);
                const splits = await this.#replyProcessors.reduce(async (acc, processor) => await acc.then(async (res) => await processor(res)), Promise.resolve(replyString.split('\n').map(l => l.trim()).filter(l => l.length > 0)))
                    .then(res => res.map(split => typeof split === 'string' ? split.split('\n').map(l => l.trim()).filter(l => l.length > 0) : split))
                    .then(res => res.flat());
                if (this.#chatMode === ChatMode.Normal) {
                    for (const split of splits) {
                        // split is NEVER an empty string
                        const sleepTime = ~~(Math.random() * 1000) + 500;
                        if (typeof split !== 'string') {
                            send(split);
                            await Bun.sleep(sleepTime);
                            continue;
                        }
                        send(textSegmentRequest(split));
                        await Bun.sleep(sleepTime);
                    }
                }
                else if (this.#chatMode === ChatMode.SingleLineReply) {
                    send(textSegmentRequest(`[CQ:reply,id=${event.message_id}][CQ:at,qq=${event.user_id}] ${splits.filter(split => typeof split === 'string').join('\n')}`));
                }
                // Save the reply to db
                const selfComingMsg = splits.filter(split => typeof split === 'string').join(' ');
                await updateHistoryToDb(selfComingMsg, true);
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                send(textSegmentRequest(`error@plugin:chatbot:${this.#id}${errorMessage.startsWith('@') ? '' : ' '}${errorMessage}`));
            }
        });
    }
    build() {
        return this.mw;
    }
}
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Preset]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "usePreset", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "useLLM", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "useDb", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "useMaster", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "enableGroup", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "enablePrivate", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "allowNext", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "useChatMode", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "setPresetHistoryInjectionCount", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "addPresetPreprocessor", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "addReplyProcessor", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], ChatMiddleware.prototype, "addCommand", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Function]),
    __metadata("design:returntype", void 0)
], ChatMiddleware.prototype, "addSuperCommand", null);
__decorate([
    constructionLog,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Object)
], ChatMiddleware.prototype, "fork", null);
