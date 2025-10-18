export class Preset {
    constructor(options) {
        this.#originalOptions = structuredClone(options);
        this.#template = options.template;
        this.#replaces = structuredClone(options.replaces) ?? [];
    }
    #originalOptions;
    #template;
    #replaces;
    addReplaceOnce(replace) {
        this.#replaces.push(replace);
        return this;
    }
    get prompt() {
        return this.#replaces.reduce((acc, [regex, replacement]) => acc.replace(regex, replacement), this.#template);
    }
    clone() {
        return new Preset(this.#originalOptions);
    }
}
