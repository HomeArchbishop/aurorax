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

export function napcatStartScriptTemplate (pm: PackageManager, entry: string): { sh: string, ps1: string } {
  const runBot = pm === 'bun' ? `bun run ${entry}` : pm === 'npm' ? `node ${entry}` : `${pm} run ${entry}`
  return {
    sh: `#!/bin/sh
set -e
docker compose up -d
echo "waiting for napcat ws :3001 ..."
until nc -z 127.0.0.1 3001 2>/dev/null; do sleep 1; done
echo "napcat ws ready, starting bot"
${runBot}
`,
    ps1: `docker compose up -d
Write-Host "waiting for napcat ws :3001 ..."
while (-not (Test-NetConnection -ComputerName 127.0.0.1 -Port 3001 -InformationLevel Quiet)) { Start-Sleep -Seconds 1 }
Write-Host "napcat ws ready, starting bot"
${runBot}
`,
  }
}

export function napcatReadmeTemplate (): string {
  return `# NapCat 集成

本项目已集成 NapCat（OneBot 11 协议端）。

## 启动

\`\`\`bash
bash scripts/start.sh   # Linux/macOS
# 或
powershell scripts/start.ps1   # Windows
\`\`\`

脚本会拉起 NapCat（docker compose）、等待 WS 端口 3001 就绪，再启动 Bot。

## 登录

首次启动需扫码登录 QQ：

\`\`\`bash
docker compose logs -f napcat
\`\`\`

登录后若 WS 服务端未自动启用（NapCat 登录后会生成 \`napcat_<QQ>.json\` 覆盖默认配置），请在 WebUI http://localhost:6099 的「网络配置」中启用名为 \`aurorax\` 的 WebSocket 服务端（端口 3001）。

## 配置

- Bot 连接：\`.env\` 中 \`AURORAX_WS_URL\` / \`AURORAX_WS_TOKEN\`
- OneBot 服务端：\`napcat/config/onebot11.json\`（端口 3001）
- WebUI：http://localhost:6099
`
}
