import { ensureType, withName } from '../internal/utils/misc';
export function createMiddleware(...args) {
    const name = args.length === 2 ? String(args[0]) : args[0]?.name || 'anonymous';
    const middleware = args.length === 2 ? args[1] : args[0];
    ensureType(middleware, 'function');
    return withName(middleware, name);
}
export function createJob(...args) {
    const name = args.length === 3 ? String(args[0]) : args[1]?.name || 'anonymous';
    const spec = args.length === 3 ? args[1] : args[0];
    const job = args.length === 3 ? args[2] : args[1];
    ensureType(job, 'function');
    return [spec, withName(job, name)];
}
export function createWebhook(...args) {
    const name = args.length === 3 ? String(args[0]) : args[1]?.name || args[0] || 'anonymous';
    const webhookId = args.length === 3 ? args[1] : args[0];
    const webhook = args.length === 3 ? args[2] : args[1];
    ensureType(webhook, 'function');
    return [webhookId, withName(webhook, name)];
}
