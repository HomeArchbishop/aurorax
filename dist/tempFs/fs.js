import fs from 'fs/promises';
export function createTempDir({ path }) {
    const tempFs = fs.mkdir(path, { recursive: true });
    return () => tempFs;
}
