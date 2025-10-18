export class OnebotApiCallbackHub {
    #apiResCallbacks = new Map();
    use(echo, okCb, failedCb) {
        this.#apiResCallbacks.set(echo, [okCb, failedCb]);
    }
    delete(echo) {
        this.#apiResCallbacks.delete(echo);
    }
    trigger(echo, res) {
        const [okCb, failedCb] = this.#apiResCallbacks.get(echo) ?? [];
        this.#apiResCallbacks.delete(echo);
        if (okCb !== undefined && res.status === 'ok') {
            okCb(res);
        }
        if (failedCb !== undefined && res.status === 'failed') {
            failedCb(res);
        }
    }
}
