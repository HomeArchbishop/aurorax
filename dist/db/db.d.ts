import { Level } from 'level';
interface DbOptions {
    path: string;
}
declare class DbConstructor extends Level {
    constructor({ path }: DbOptions);
}
export type Db = DbConstructor;
export declare function createDb({ path }: DbOptions): Promise<() => Db>;
export {};
//# sourceMappingURL=db.d.ts.map