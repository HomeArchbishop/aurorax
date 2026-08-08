import path from 'path';
import { pathToFileURL } from 'url';
import { existsSync } from 'fs';
const ENTRY_EXTENSIONS = ['js', 'mjs', 'cjs', 'ts', 'mts', 'cts'];
export function resolveEntry(entry) {
    const resolved = path.resolve(entry);
    if (path.extname(resolved) !== '') {
        return pathToFileURL(resolved).href;
    }
    for (const ext of ENTRY_EXTENSIONS) {
        const candidate = `${resolved}.${ext}`;
        if (existsSync(candidate)) {
            return pathToFileURL(candidate).href;
        }
    }
    return pathToFileURL(`${resolved}.js`).href;
}
