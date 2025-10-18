/**
 * @internal
 * Used in `ChatMiddleware` to create a command registrar function
 * @param commandRegistry - The command registry to register the command to
 * @returns A command registrar function
 */
export function createCommandRegistrar(commandRegistry) {
    return (command) => {
        commandRegistry.push(command);
        return this;
    };
}
/**
 * Util function to create a command
 * @param command - The command to create
 * @param cb - The callback function
 * @param options - The options for the command
 * @returns A command
 */
export function createCommand(pattern, cb, options) {
    return {
        command: (Array.isArray(pattern) ? pattern : [pattern]).map(cmd => {
            if (typeof cmd === 'string') {
                return new RegExp(`^${cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s)`);
            }
            return cmd;
        }),
        permission: options.permission,
        callback: cb,
    };
}
