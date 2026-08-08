const webhookBody = (webhookId) => `app.useWebhook('${webhookId}', async (ctx) => {
  const payload = JSON.parse(new TextDecoder().decode(ctx.event.body))
  console.log('[webhook]', payload)
})
`;
const entryBody = (name, includeWebhook) => `// ${name} - aurorax bot entry
import { App } from 'aurorax'

const app = new App({
  onebot: {
    type: 'ws-reverse',
    url: process.env.AURORAX_WS_URL ?? 'ws://localhost:8080',
    token: process.env.AURORAX_WS_TOKEN,
    timeout: Number(process.env.AURORAX_WS_TIMEOUT ?? 8000),
  },
  webhook: {
    port: Number(process.env.AURORAX_WEBHOOK_PORT ?? 3000),
    tokens: [],
  },
})

app.useMw(async (ctx, next) => {
  const msg = Array.isArray(ctx.event.message)
    ? ctx.event.message.map(s => s.type === 'text' ? s.data.text : '').join('')
    : ''
  console.log('[message]', msg)
  await next()
})

${includeWebhook ? webhookBody('github') : ''}await app.start()
`;
const templates = {
    js: {
        entry: (name, includeWebhook) => `${entryBody(name, includeWebhook)}\n`,
    },
    ts: {
        entry: (name, includeWebhook) => `${entryBody(name, includeWebhook)}\n`,
    },
};
export const templateTypes = Object.keys(templates);
export const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'];
function scriptsFor(pm, type) {
    const entry = `index.${type}`;
    if (pm === 'bun') {
        return { start: `bun ${entry}`, dev: `bun --watch ${entry}` };
    }
    if (type === 'ts') {
        return {
            start: `node --experimental-strip-types ${entry}`,
            dev: `node --watch --experimental-strip-types ${entry}`,
        };
    }
    return { start: `node ${entry}`, dev: `node --watch ${entry}` };
}
export function entryTemplate(name, type, includeWebhook = false) {
    return templates[type].entry(name, includeWebhook);
}
export function pkgTemplate(name, type, pm = 'npm') {
    return JSON.stringify({
        name,
        version: '1.0.0',
        type: 'module',
        dependencies: { aurorax: '^1.0.0' },
        scripts: scriptsFor(pm, type),
    }, null, 2);
}
export function readmeTemplate(pm = 'npm') {
    const runDev = pm === 'npm' || pm === 'bun' ? `${pm} run dev` : `${pm} dev`;
    return `# Aurorax Bot

基于 aurorax 的轻量级 Bot 框架

## 快速开始

\`\`\`bash
${pm} install
${runDev}
\`\`\`
`;
}
