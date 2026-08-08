import { Command } from 'commander';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { logger } from '../../internal/logger';
import { resolveEntry } from '../utils';
export function devCommand() {
    return new Command('dev')
        .description('Start the bot in watch mode, auto-restart on file changes')
        .argument('[entry]', 'entry file path', 'index.js')
        .action((entry) => {
        const resolved = resolveEntry(entry);
        const entryPath = fileURLToPath(resolved);
        logger.info(`aurorax dev watching entry: ${resolved}`);
        const child = spawn(process.execPath, ['--watch', entryPath], { stdio: 'inherit' });
        child.on('exit', code => process.exit(code ?? 0));
    });
}
