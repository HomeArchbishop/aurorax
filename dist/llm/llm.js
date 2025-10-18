import axios from 'axios';
import { OpenaiAdapter, SiliconflowAdapter } from './internal/platform-adapters';
import { KeyPool } from './internal/key-pool';
export class LLM {
    #isInitialized = false;
    #keys;
    #keyPool;
    #platform;
    #apiHost;
    #model;
    #temperature;
    #topP;
    #additionalHeaders;
    #adapter;
    constructor({ platform, apiHost, keys, model, temperature = 0.7, topP = 1.0, additionalHeaders = {}, }) {
        this.#platform = platform;
        this.#apiHost = apiHost;
        this.#keys = keys;
        this.#keyPool = new KeyPool(keys);
        this.#model = model;
        this.#temperature = temperature;
        this.#topP = topP;
        this.#additionalHeaders = additionalHeaders;
        this.#adapter = this.#initializeAdapter(platform);
        this.#isInitialized = true;
    }
    #initializeAdapter(platform) {
        switch (platform) {
            case 'siliconflow':
                return new SiliconflowAdapter();
            case 'openai':
            default:
                return new OpenaiAdapter();
        }
    }
    getPlatform() {
        return this.#platform;
    }
    getKeyStatuses() {
        return this.#keyPool.getKeyStatuses();
    }
    /* ==================== [Start] Completions ==================== */
    async completions(messages) {
        this.#validateCompletionsRequest();
        const { key, keyIndex } = this.#selectRandomKey();
        try {
            const resp = await this.#makeCompletionsRequest(key, messages);
            this.#keyPool.markValid(keyIndex);
            return resp.data.choices[0].message.content.trim();
        }
        catch (err) {
            const error = this.#handleCompletionsError(err, key, keyIndex);
            if (error === 'retry') {
                return this.completions(messages);
            }
            throw error;
        }
    }
    #validateCompletionsRequest() {
        if (!this.#isInitialized) {
            throw new Error('LLM is not initialized. Please wait for initialization to complete.');
        }
        if (this.#model === undefined) {
            throw new Error('Model is not set');
        }
    }
    #selectRandomKey() {
        const okKeys = this.#keyPool.getValidKeys();
        if (okKeys.length === 0) {
            throw new Error('No valid API keys available');
        }
        const keyIndexOfValid = Math.floor(Math.random() * okKeys.length);
        const keyObject = okKeys[keyIndexOfValid];
        return { key: keyObject.key, keyIndex: keyObject.keyIndex };
    }
    async #makeCompletionsRequest(key, messages) {
        return await this.#adapter.completions({
            apiHost: this.#apiHost,
            key,
            additionalHeaders: this.#additionalHeaders,
            data: {
                model: this.#model,
                messages,
                temperature: this.#temperature,
                topP: this.#topP,
            },
        });
    }
    #handleCompletionsError(err, key, keyIndex) {
        if (axios.isAxiosError(err) && err.response !== undefined) {
            const message = `@llmCompletionsRequest [${err.message}] ${err.response.data.message ?? ''}`;
            if (err.response.status === 401 /* Invalid API Key */ || err.response.status === 403 /* No Balance */) {
                this.#keyPool.markInvalid(keyIndex);
                return 'retry';
            }
            return new Error(`${message} (key: #${keyIndex} ${key.slice(0, 6)}...)`);
        }
        return new Error(`@llmCompletionsRequest ${err?.message ?? String(err)}`);
    }
    /* ==================== [End] Completions ==================== */
    clone() {
        return new LLM({
            platform: this.#platform,
            apiHost: this.#apiHost,
            keys: this.#keys,
            model: this.#model,
            temperature: this.#temperature,
            topP: this.#topP,
            additionalHeaders: { ...this.#additionalHeaders },
        });
    }
}
