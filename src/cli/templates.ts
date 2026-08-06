export type TemplateType = 'js' | 'ts'
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

interface Template {
  entry (name: string, includeWebhook: boolean): string
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
  },
  ts: {
    entry: (name, includeWebhook) => `${entryBody(name, includeWebhook)}\n`,
  },
}

export const templateTypes = Object.keys(templates) as TemplateType[]
export const packageManagers: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun']

function scriptsFor (pm: PackageManager, type: TemplateType): Record<string, string> {
  const entry = `index.${type}`
  if (pm === 'bun') {
    return { start: `bun ${entry}`, dev: `bun --watch ${entry}` }
  }
  if (type === 'ts') {
    return {
      start: `node --experimental-strip-types ${entry}`,
      dev: `node --watch --experimental-strip-types ${entry}`,
    }
  }
  return { start: `node ${entry}`, dev: `node --watch ${entry}` }
}

export function entryTemplate (name: string, type: TemplateType, includeWebhook = false): string {
  return templates[type].entry(name, includeWebhook)
}

export function pkgTemplate (name: string, type: TemplateType, pm: PackageManager = 'npm'): string {
  return JSON.stringify({
    name,
    version: '1.0.0',
    type: 'module',
    dependencies: { aurorax: '^1.0.0' },
    scripts: scriptsFor(pm, type),
  }, null, 2)
}

export function readmeTemplate (pm: PackageManager = 'npm'): string {
  const runDev = pm === 'npm' || pm === 'bun' ? `${pm} run dev` : `${pm} dev`
  return `# Aurorax Bot

基于 aurorax 的轻量级 Bot 框架

## 快速开始

\`\`\`bash
${pm} install
${runDev}
\`\`\`
`
}
