import { WebSocket } from 'ws';
import { logger } from '../../../internal/logger';
import { OnebotApiCallbackHub } from '../onebot-api-callback-hub';
import EventEmitter from 'events';
export const WsReverseOnebotBridge = class WsReverseOnebotBridge extends EventEmitter {
    #config;
    #ws;
    #onebotApiCallbackHub = new OnebotApiCallbackHub();
    constructor(config) {
        super();
        this.#config = config;
    }
    addOnebotEventListener(listener) {
        this.on('onebot-event', listener);
    }
    send = (req, resOkCb, resFailedCb) => {
        if (!this.#ws) {
            throw new Error('The connection (ws-reverse) is not established');
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
        const { resolve, reject, promise } = Promise.withResolvers();
        this.#ws = new WebSocket(this.#config.url, {
            timeout: 8000,
            headers: {
                Authorization: this.#config.token ? `Bearer ${this.#config.token}` : '',
            },
        });
        this.#ws.addEventListener('open', () => {
            logger.debug('ws to onebot connected');
            resolve();
        });
        this.#ws.addEventListener('error', (err) => {
            logger.error('ws to onebot error: ' + err.message);
            reject(new Error('WebSocket error: ' + err.message));
        });
        this.#ws.addEventListener('message', ({ data: wsMsgData }) => {
            const hash = Math.random().toString(36).slice(2, 10);
            const raw = String(wsMsgData);
            logger.debug(`ws received ws_msg#${hash}: ` + raw);
            const parsed = JSON.parse(raw);
            logger.silly(`parsed ws_msg#${hash}: ` + JSON.stringify(parsed, null, 2));
            // Is an ApiResponse
            if (Object.prototype.hasOwnProperty.call(parsed, 'status')) {
                logger.debug(`ws_msg#${hash} is an ApiResponse, calling callback (if any)`);
                const res = parsed;
                this.#onebotApiCallbackHub.trigger(res.echo, res);
                return;
            }
            // Is a OnebotEvent
            const event = parsed;
            this.emit('onebot-event', event);
        });
        return promise;
    }
};
