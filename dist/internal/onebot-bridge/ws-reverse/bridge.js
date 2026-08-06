import { WebSocket } from 'ws';
import { logger } from '../../../internal/logger';
import { OnebotApiCallbackHub } from '../onebot-api-callback-hub';
import EventEmitter from 'events';
const DEFAULT_RECONNECT = { maxAttempts: Infinity, retryIntervalMs: 3000 };
export const WsReverseOnebotBridge = class WsReverseOnebotBridge extends EventEmitter {
    #config;
    #ws;
    #onebotApiCallbackHub = new OnebotApiCallbackHub();
    #reconnectTimer;
    #reconnectAttempts = 0;
    #manualClose = false;
    constructor(config) {
        super();
        this.#config = config;
    }
    addOnebotEventListener(listener) {
        this.on('onebot-event', listener);
    }
    send = (req, resOkCb, resFailedCb) => {
        if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
            throw new Error('The connection (ws-reverse) is not established or is reconnecting');
        }
        const echo = Math.random().toString(36).slice(2, 10);
        const echoReq = { ...req, echo };
        const raw = JSON.stringify(echoReq);
        this.#onebotApiCallbackHub.use(echo, resOkCb, resFailedCb);
        logger.debug(`ws sending with echo:${echo}: ` + raw);
        logger.silly(`ws sending with echo:${echo}: ` + JSON.stringify(echoReq, null, 2));
        this.#ws.send.bind(this.#ws)(raw);
        logger.debug(`ws sent with echo:${echo}`);
    };
    async establishConnectionToOnebot() {
        this.#manualClose = false;
        await this.#connect();
    }
    async #connect() {
        return new Promise((resolve, reject) => {
            const timeout = this.#config.timeout ?? 8000;
            const ws = new WebSocket(this.#config.url, {
                timeout,
                headers: {
                    Authorization: this.#config.token ? `Bearer ${this.#config.token}` : '',
                },
            });
            this.#ws = ws;
            ws.addEventListener('open', () => {
                this.#reconnectAttempts = 0;
                logger.debug('ws to onebot connected');
                resolve();
            });
            ws.addEventListener('error', (err) => {
                logger.error('ws to onebot error: ' + err.message);
                reject(new Error('WebSocket error: ' + err.message));
            });
            ws.addEventListener('close', () => {
                logger.warn('ws to onebot closed');
                if (this.#manualClose)
                    return;
                this.#scheduleReconnect();
            });
            ws.addEventListener('message', ({ data: wsMsgData }) => {
                const hash = Math.random().toString(36).slice(2, 10);
                const raw = String(wsMsgData);
                logger.debug(`ws received ws_msg#${hash}: ` + raw);
                let parsed;
                try {
                    parsed = JSON.parse(raw);
                }
                catch (err) {
                    logger.error(`ws_msg#${hash} failed to parse: ` + err.message);
                    return;
                }
                logger.silly(`parsed ws_msg#${hash}: ` + JSON.stringify(parsed, null, 2));
                if (Object.prototype.hasOwnProperty.call(parsed, 'status')) {
                    logger.debug(`ws_msg#${hash} is an ApiResponse, calling callback (if any)`);
                    const res = parsed;
                    this.#onebotApiCallbackHub.trigger(res.echo, res);
                    return;
                }
                const event = parsed;
                this.emit('onebot-event', event);
            });
        });
    }
    #scheduleReconnect() {
        const { maxAttempts = DEFAULT_RECONNECT.maxAttempts, retryIntervalMs = DEFAULT_RECONNECT.retryIntervalMs } = this.#config.reconnect ?? {};
        if (this.#reconnectAttempts >= maxAttempts) {
            logger.error(`ws to onebot reconnect exhausted after ${this.#reconnectAttempts} attempts`);
            return;
        }
        this.#reconnectAttempts++;
        const delay = retryIntervalMs * Math.pow(2, Math.min(this.#reconnectAttempts - 1, 5));
        logger.warn(`ws to onebot reconnecting in ${delay}ms (attempt ${this.#reconnectAttempts})`);
        this.#reconnectTimer = setTimeout(() => {
            this.#connect().catch(err => logger.error('ws reconnect failed: ' + err.message));
        }, delay);
    }
};
