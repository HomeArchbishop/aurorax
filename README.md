<div align="center">
    <img src="./docs/public/aurorax-header.png" alt="Aurorax" width="100%">
</div>

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-339933?style=for-the-badge)](https://bun.sh/)

基于 [OneBot 11](https://github.com/botuniverse/onebot-11) 协议的 Node.js Bot 开发框架，采用类 Koa 中间件模式，以极低心智负担构建功能丰富的聊天机器人。

---

## 特性

- **中间件管道** — 类 Koa 的 `async/await` 中间件链，支持 `next()` 控制流
- **定时任务** — 基于 cron 表达式的任务调度
- **Webhook 集成** — 内置 HTTP 服务器，轻松接入 GitHub、GitLab 等外部服务
- **完整类型支持** — 完整的 TypeScript 类型定义，IDE 友好
- **链式 API** — 流畅的链式调用风格 `app.useMw(...).useMw(...).useJob(...)`
- **日志系统** — 内置 Winston 日志，支持按日滚动文件

---

## 安装

```bash
npm install aurorax
# 或
bun add aurorax
```

> **要求**：Node.js 18+，TypeScript 5.x（推荐），ESM 模块

---

## CLI 工具

Aurorax 附带命令行工具，帮助你快速创建和运行 Bot 项目。

```bash
bunx aurorax --help
```

### `aurorax init`

```bash
bunx aurorax init                # 进入交互向导
bunx aurorax init my-bot         # 指定目录
bunx aurorax init -t ts my-bot   # 指定 TS 模板
bunx aurorax init -y my-bot      # 跳过提示，使用默认值
```

向导包含以下选项：

- **Project directory** — 项目目录（默认 `.`）
- **Select entry template** — `js` / `ts` 模板
- **Select package manager** — `npm` / `pnpm` / `yarn` / `bun`
- **Include a sample webhook handler?** — 是否生成 Webhook 示例
- **Install dependencies now?** — 是否立即安装依赖

### `aurorax start`

启动 Bot，加载入口文件

```bash
bunx aurorax start          # 加载 ./index.js
bunx aurorax start app      # 加载 ./app.js（自动补全扩展名）
```

### `aurorax dev`

监听模式启动，文件变更后自动重启。

```bash
bunx aurorax dev            # 监听 ./index.js
bunx aurorax dev app        # 监听 ./app.js
```

### `aurorax napcat`

集成 [NapCat](https://github.com/NapNeko/NapCatQQ)（OneBot 11 协议端），一键合并为完整 Bot。

```bash
bunx aurorax init --with-napcat my-bot   # 初始化时集成 NapCat
bunx aurorax napcat install              # 安装 NapCat（默认 docker，--native 原生）
bunx aurorax napcat config -p 3001       # 写入 onebot11.json 预置配置
bunx aurorax napcat start                # 启动 NapCat 服务
```

`init --with-napcat` 会额外生成：`docker-compose.yml`、`napcat/config/onebot11.json`（WS 服务端 :3001 预置，免 WebUI 配置）、`.env`、`scripts/start.sh|ps1` 一键启动脚本。

> 需要完整开箱体验？仓库内置 [@aurorax/aurorax-bot](./packages/bot)（`packages/bot`），预置全部结构与编排脚本，一行 `bun run bot:setup && bun run bot:start` 拉起 NapCat + Bot。

---

## 快速开始



### 1. 创建应用实例

```typescript
import { App } from 'aurorax'

const app = new App({
  onebot: {
    type: 'ws-reverse',
    url: 'ws://localhost:8080',
    token: 'your-token'  // 可选
  }
})
```



### 2. 添加中间件

```typescript
// 日志中间件
app.useMw(async (ctx, next) => {
  console.log(`[${ctx.event.post_type}] 来自 ${ctx.event.user_id}`)
  await next()
})

// 回复中间件
app.useMw(async (ctx, next) => {
  if (ctx.event.message === 'ping') {
    ctx.send({ action: 'send_private_msg', params: {
      user_id: ctx.event.user_id,
      message: 'pong'
    }})
  }
  await next()
})
```



### 3. 启动

```typescript
await app.start()
```

---



## 核心 API



### `new App(options)`


| 选项               | 类型             | 说明                    |
| ---------------- | -------------- | --------------------- |
| `onebot.type`    | `'ws-reverse'` | OneBot 连接方式           |
| `onebot.url`     | `string`       | WebSocket 地址          |
| `onebot.token`   | `string?`      | 鉴权 Token（可选）          |
| `webhook.port`   | `number?`      | Webhook 监听端口（默认 3000） |
| `webhook.tokens` | `string[]?`    | Webhook 鉴权 Token 列表   |




### `app.useMw(middleware)`

注册 OneBot 事件中间件。所有中间件按注册顺序组成处理链。

```typescript
type Middleware = (
  ctx: Readonly<Context<OnebotEvent>>,
  next: () => Promise<void>
) => Promise<void>
```



### `app.useJob(spec, job)`

注册 cron 定时任务。`spec` 为标准 5 字段 cron 表达式。

```typescript
app.useJob('0 9 * * *', async (ctx) => {
  // ctx.event.timestamp — 触发时间戳
  // ctx.event.spec — cron 表达式
})
```



### `app.useWebhook(webhookId, handler)`

注册 Webhook 处理器。`webhookId` 对应请求路径中的标识符。

```typescript
app.useWebhook('github', async (ctx) => {
  // ctx.event.webhookId — 'github'
  // ctx.event.query — URLSearchParams
  // ctx.event.body — ArrayBuffer
})
```



### `app.start()`

建立 OneBot WebSocket 连接，启动 cron 调度器，并在注册了 webhook 处理器时启动 HTTP 服务器。

---



## 使用示例



### 错误处理中间件

```typescript
app.useMw(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    console.error('处理异常:', err)
  }
})
```



### 限流中间件工厂

```typescript
function rateLimit(maxPerMinute: number) {
  const counters = new Map<number, number[]>()

  return async (ctx: Context<OnebotEvent>, next: () => Promise<void>) => {
    const uid = ctx.event.user_id
    const now = Date.now()
    const hits = (counters.get(uid) ?? []).filter(t => now - t < 60_000)

    if (hits.length >= maxPerMinute) return
    counters.set(uid, [...hits, now])
    await next()
  }
}

app.useMw(rateLimit(10))
```



### Webhook 接收 GitHub Push

```typescript
const app = new App({
  onebot: { type: 'ws-reverse', url: 'ws://localhost:8080' },
  webhook: { port: 3000, tokens: ['secret'] }
})

app.useWebhook('github', async (ctx) => {
  const payload = JSON.parse(new TextDecoder().decode(ctx.event.body))
  if (payload.ref === 'refs/heads/main') {
    ctx.send({
      action: 'send_group_msg',
      params: { group_id: 123456, message: `${payload.pusher.name} 推送了新代码` }
    })
  }
})

await app.start()
```

---

