import { logger } from '../logger';
import http from 'http';
import EventEmitter from 'events';
export class WebhookServer extends EventEmitter {
    #isStarted = false;
    #port;
    #tokens;
    constructor({ port, tokens }) {
        super();
        this.#port = port;
        this.#tokens = tokens;
    }
    #body(req) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            req.on('data', (chunk) => {
                chunks.push(chunk);
            });
            req.on('end', () => {
                resolve(Buffer.concat(chunks).buffer);
            });
        });
    }
    #auth(headers) {
        return this.#tokens.length === 0 || this.#tokens.includes(headers.authorization ?? '');
    }
    addWebhookEventListener(listener) {
        this.on('webhook-event', listener);
    }
    async start() {
        if (this.#isStarted) {
            throw new Error('Webhook server is already started');
        }
        const server = http.createServer(async (req, res) => {
            const url = new URL(req.url ?? '', `http://${req.headers.host}`);
            const pathname = url.pathname;
            if (/^\/webhook\/[^/]+$/.test(pathname) && req.method === 'POST') {
                const response = await this.#handleWebhook(req, url);
                res
                    .writeHead(response.status, Object.fromEntries(response.headers))
                    .end(await response.text());
            }
            else {
                const response = await this.#handleOthers();
                res
                    .writeHead(response.status, Object.fromEntries(response.headers))
                    .end(await response.text());
            }
        });
        server.listen(this.#port);
        logger.debug('webhook server started');
        this.#isStarted = true;
    }
    async #handleWebhook(req, url) {
        if (!this.#auth(req.headers)) {
            return new Response('Unauthorized', { status: 401 });
        }
        const webhookId = url.pathname.split('/').pop();
        if (!webhookId) {
            return new Response('Webhook ID is required', { status: 400 });
        }
        const params = url.searchParams; // query parameters
        const body = await this.#body(req);
        const event = { webhookId, query: params, body };
        try {
            this.emit('webhook-event', event);
        }
        catch (err) {
            return new Response('Webhook processing error: ' + String(err), { status: 500 });
        }
        return new Response('Webhook processed successfully', { status: 200 });
    }
    async #handleOthers() {
        return new Response('Not Found', { status: 404 });
    }
}
