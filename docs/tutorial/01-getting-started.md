# 教程 01：快速开始

> **目标**：在 10 分钟内搭建并运行你的第一个 Aurorax 机器人。

## 前置条件

- Bun / Node.js 18+（推荐 LTS）
- 一个运行中的 OneBot 实现（如 [Lagrange.Core](https://github.com/LagrangeDev/Lagrange.Core)、[NapCat](https://github.com/NapNeko/NapCatQQ) 等）

## 第一步：创建项目

::: code-group

```bash [bun]
mkdir my-bot && cd my-bot
bun init -y
bun add aurorax
```

```bash [npm]
mkdir my-bot && cd my-bot
npm init -y
npm install aurorax
npm install -D typescript @types/node
npx tsc --init
```

```bash [yarn]
mkdir my-bot && cd my-bot
yarn init -y
yarn add aurorax
yarn add -D typescript @types/node
yarn tsc --init
```

```bash [pnpm]
mkdir my-bot && cd my-bot
pnpm init
pnpm add aurorax
pnpm add -D typescript @types/node
pnpx tsc --init
```

:::

::: code-group

```[bun]
bun 原生支持 TypeScript，无需额外配置，跳过此步即可。
```

```json [npm]
// 将 tsconfig.json 中的 module 和 moduleResolution 调整为 ESM：
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "strict": true
  }
}
// 同时在 package.json 中添加 "type": "module"
```

```json [yarn]
// 将 tsconfig.json 中的 module 和 moduleResolution 调整为 ESM：
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "strict": true
  }
}
// 同时在 package.json 中添加 "type": "module"
```

```json [pnpm]
// 将 tsconfig.json 中的 module 和 moduleResolution 调整为 ESM：
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "strict": true
  }
}
// 同时在 package.json 中添加 "type": "module"
```

:::

## 第二步：连接 OneBot

Aurorax 支持 OneBot 11 的两种 WebSocket 模式：

| `onebot.type` | 含义 | 谁监听 |
|---------------|------|--------|
| `ws`（正向） | App 作为客户端连到 OneBot | OneBot 实现 |
| `ws-reverse`（反向） | App 监听，OneBot 连过来 | Aurorax |

入门示例用 **正向 `ws`**：让 OneBot 实现开启正向 WebSocket，Aurorax 连过去。

> 以 NapCat 为例，开启正向 WebSocket，并记下其监听地址（如下仅为示意）：
> ```json
> {
>   "websocket": {
>     "enable": true,
>     "host": "localhost",
>     "port": 8080
>   }
> }
> ```
>
> 若要用反向：Aurorax 设 `type: 'ws-reverse'` 与监听 `url`，OneBot 端配置反向 WebSocket 指向该地址。

> Aurorax 基于 [OneBot 11 协议](https://github.com/botuniverse/onebot-11)。事件结构、API 列表等协议细节请查阅该文档，本教程系列不重复讲述。

## 第三步：编写第一个 Bot

创建 `src/index.ts`：

```typescript
import { App } from 'aurorax'

const app = new App({
  onebot: {
    type: 'ws',
    url: 'ws://localhost:8080',
    // token: 'your-access-token'  // 若 OneBot 端配置了鉴权则填写
  }
})

// 打印所有收到的事件
app.useMw(async (ctx, next) => {
  console.log('收到事件:', ctx.event.post_type)
  await next()
})

// 回复 "ping"
app.useMw(async (ctx, next) => {
  const event = ctx.event

  if (event.post_type === 'message' && event.message_type === 'private') {
    const text = event.raw_message
    if (text === 'ping') {
      ctx.send({
        action: 'send_private_msg',
        params: { user_id: event.user_id, message: 'pong' }
      })
    }
  }

  await next()
})

await app.start()
console.log('Bot 已启动')
```

## 第四步：运行

::: code-group

```bash [bun]
bun src/index.ts
```

```bash [npm]
npx tsc && node dist/index.js
```

```bash [yarn]
yarn tsc && node dist/index.js
```

```bash [pnpm]
pnpx tsc && node dist/index.js
```

:::

向 Bot 发送私聊消息 `ping`，它应该回复 `pong`。

## 发生了什么？

```
用户消息 → OneBot 实现 → WebSocket → Aurorax
                                       ↓
                                    中间件 1（日志）
                                       ↓
                                    中间件 2（回复逻辑）
```

1. OneBot 实现（NapCat 等）收到 QQ 消息后，通过 WebSocket 将事件推送给 Aurorax
2. `App` 将事件交给注册的中间件链依次处理
3. 中间件通过 `ctx.send()` 调用 OneBot API 发送回复

## 下一步

- [教程 02：中间件模式](./02-middleware.md) — 深入理解中间件的执行顺序与组合方式
