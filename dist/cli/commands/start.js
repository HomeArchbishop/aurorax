import { Command } from 'commander';
import { logger } from '../../internal/logger';
import { resolveEntry } from '../utils';
export function startCommand() {
    return new Command('start')
        .description('Start the bot by loading a JS entry file (default: index.js)')
        .argument('[entry]', 'entry file path', 'index.js')
        .action(async (entry) => {
        const resolved = resolveEntry(entry);
        logger.info(`aurorax starting with entry: ${resolved}`);
        await import(resolved);
    });
}
