import { Level } from 'level';
class DbConstructor extends Level {
    constructor({ path }) {
        super(path, { valueEncoding: 'json' });
    }
}
export async function createDb({ path }) {
    const db = new DbConstructor({ path });
    await db.open();
    return () => db;
}
