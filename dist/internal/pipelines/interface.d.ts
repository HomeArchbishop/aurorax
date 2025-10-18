export interface EventMeta {
    hash: string;
}
export interface Pipeable<E> {
    pipeTo(pipeline: Pipeline<E>): void;
}
export interface Pipeline<E> {
    execute(event: E, meta: EventMeta): Promise<void>;
}
//# sourceMappingURL=interface.d.ts.map