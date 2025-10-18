import fs from 'fs/promises';
export async function createTempDir({ path }) {
    await fs.mkdir(path, { recursive: true });
    return () => path;
}
