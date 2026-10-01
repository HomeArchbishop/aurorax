import { WebSocket } from 'ws';
import { logger } from '../../../internal/logger';
import { OnebotApiCallbackHub } from '../onebot-api-callback-hub';
import EventEmitter from 'events';
export const WsReverseOnebotBridge = class WsReverseOnebotBridge extends EventEmitter {
    #config;
    #ws;
    #onebotApiCallbackHub = new OnebotApiCallbackHub();
    #reconnectTimer;
    #reconnectAttempts = 0;
    #manualClose = false;
    #pendingConnect;
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
        this.#clearReconnectTimer();
        try {
            await this.#connect();
        }
        catch (err) {
            this.closeConnectionToOnebot();
            throw err;
        }
    }
    closeConnectionToOnebot() {
        this.#manualClose = true;
        this.#clearReconnectTimer();
        this.#reconnectAttempts = 0;
        this.#teardownWs();
    }
    async #connect() {
        this.#teardownWs();
        const { resolve, reject, promise } = Promise.withResolvers();
        this.#pendingConnect = { resolve, reject };
        const timeout = this.#config.timeout ?? 8000;
        const ws = new WebSocket(this.#config.url, {
            timeout,
            headers: {
                Authorization: this.#config.token ? `Bearer ${this.#config.token}` : '',
            },
        });
        this.#ws = ws;
        ws.addEventListener('open', () => {
            this.#pendingConnect = undefined;
            this.#reconnectAttempts = 0;
            logger.debug('ws to onebot connected');
            resolve();
        });
        ws.addEventListener('error', (err) => {
            this.#pendingConnect = undefined;
            logger.error('ws to onebot error: ' + err.message);
            reject(new Error('WebSocket error: ' + err.message));
        });
        ws.addEventListener('close', () => {
            if (this.#ws !== ws)
                return;
            this.#ws = undefined;
            this.#onebotApiCallbackHub.clear();
            logger.warn('ws to onebot closed');
            if (!this.#manualClose)
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
        return promise;
    }
    #teardownWs() {
        if (this.#pendingConnect) {
            this.#pendingConnect.reject(new Error('The connection (ws-reverse) was closed'));
            this.#pendingConnect = undefined;
        }
        this.#onebotApiCallbackHub.clear();
        const ws = this.#ws;
        if (!ws)
            return;
        this.#ws = undefined;
        ws.removeAllListeners();
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
        }
    }
    #clearReconnectTimer() {
        if (this.#reconnectTimer === undefined)
            return;
        clearTimeout(this.#reconnectTimer);
        this.#reconnectTimer = undefined;
    }
    #scheduleReconnect() {
        this.#clearReconnectTimer();
        const maxAttempts = this.#config.reconnect?.maxAttempts ?? Infinity;
        const retryIntervalMs = this.#config.reconnect?.retryIntervalMs ?? 3000;
        if (this.#reconnectAttempts >= maxAttempts) {
            logger.error(`ws to onebot reconnect exhausted after ${this.#reconnectAttempts} attempts`);
            this.#manualClose = true;
            return;
        }
        this.#reconnectAttempts++;
        const delay = retryIntervalMs * Math.pow(2, Math.min(this.#reconnectAttempts - 1, 5));
        logger.warn(`ws to onebot reconnecting in ${delay}ms (attempt ${this.#reconnectAttempts})`);
        this.#reconnectTimer = setTimeout(() => {
            this.#reconnectTimer = undefined;
            this.#connect().catch(err => logger.error('ws reconnect failed: ' + err.message));
        }, delay);
    }
};
