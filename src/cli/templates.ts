export type TemplateType = 'js' | 'ts'

interface Template {
  entry (name: string, includeWebhook: boolean): string
  scripts: Record<string, string>
}

const webhookBody = (webhookId: string) => `app.useWebhook('${webhookId}', async (ctx) => {
  const payload = JSON.parse(new TextDecoder().decode(ctx.event.body))
  console.log('[webhook]', payload)
})
`

const entryBody = (name: string, includeWebhook: boolean) => `// ${name} - aurorax bot entry
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
`

const templates: Record<TemplateType, Template> = {
  js: {
    entry: (name, includeWebhook) => `${entryBody(name, includeWebhook)}\n`,
    scripts: {
      start: 'node index.js',
      dev: 'node --watch index.js',
    },
  },
  ts: {
    entry: (name, includeWebhook) => `${entryBody(name, includeWebhook)}\n`,
    scripts: {
      start: 'node --experimental-strip-types index.ts',
      dev: 'node --watch --experimental-strip-types index.ts',
    },
  },
}

export const templateTypes = Object.keys(templates) as TemplateType[]

export function entryTemplate (name: string, type: TemplateType, includeWebhook = false): string {
  return templates[type].entry(name, includeWebhook)
}

export function pkgTemplate (name: string, type: TemplateType): string {
  return JSON.stringify({
    name,
    version: '1.0.0',
    type: 'module',
    dependencies: { aurorax: '^1.0.0' },
    scripts: templates[type].scripts,
  }, null, 2)
}

export const readmeTemplate = () => `# Aurorax Bot

基于 aurorax 的轻量级 Bot 框架

## 快速开始

\`\`\`bash
npm install
npm start
\`\`\`
`
