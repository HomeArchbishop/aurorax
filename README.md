# Aurorax - Programming Bot Framework for node.js

Aurorax 采用类似 Koa.js 的中间件模式，以极低的心智负担开发 Bot。

框架基于 [OneBot11 标准协议](https://github.com/botuniverse/onebot-11)。 [OneBot12](https://12.onebot.dev/) 标准协议正在候选阶段，且 OneBot12 的实现较少。因此本框架不支持 OneBot12。

```typescript
import { App } from 'aurorax'

const app = new App({
  onebot: {
    type: 'ws-reverse',
    url: 'ws://localhost:8080',
    token: 'your-token'
  }
})

// 添加中间件 - 类似 Koa 的 app.use()
app.useMw(async (ctx, next) => {
  console.log('收到消息:', ctx.event)
  await next() // 继续执行下一个中间件
})

// 消息处理中间件
app.useMw(async (ctx, next) => {
  if (ctx.event.message === '你好') {
    await ctx.send('你好！我是 Aurorax 机器人')
  }
  await next()
})

// 启动机器人
await app.start()
```

### 定时任务

```typescript
// 每天上午 9 点发送问候
app.useJob('0 9 * * *', async (ctx) => {
  await ctx.send('早上好！新的一天开始了！')
})

// 每 5 分钟检查一次
app.useJob('*/5 * * * *', async (ctx) => {
  // 执行定期检查逻辑
  console.log('执行定期检查...')
})
```

### Webhook 集成

```typescript
// 添加 webhook 支持
const app = new App({
  onebot: {
    type: 'ws-reverse',
    url: 'ws://localhost:8080/ws'
  },
  webhook: {
    port: 3000,
    tokens: ['your-webhook-token']
  }
})

// 处理 webhook 事件
app.useWebhook('github', async (ctx) => {
  const event = ctx.event
  if (event.type === 'push') {
    await ctx.send(`收到新的代码推送: ${event.repository.name}`)
  }
})
```

## 中间件模式

Aurorax 采用类似 Koa 的中间件模式，让你能够：

### 1. 链式调用
```typescript
app
  .useMw(loggerMiddleware)
  .useMw(authMiddleware)
  .useMw(messageHandler)
  .useJob('0 0 * * *', dailyTask)
```

### 2. 中间件组合
```typescript
// 日志中间件
const logger = async (ctx, next) => {
  console.log(`[${new Date().toISOString()}] 收到事件:`, ctx.event.type)
  await next()
  console.log('处理完成')
}

// 权限检查中间件
const auth = async (ctx, next) => {
  if (ctx.event.user_id === 'admin') {
    await next()
  } else {
    await ctx.send('权限不足')
  }
}

app.useMw(logger).useMw(auth)
```

### 3. 错误处理
```typescript
const errorHandler = async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    console.error('处理消息时出错:', error)
    await ctx.send('抱歉，处理您的消息时出现了错误')
  }
}

app.useMw(errorHandler)
```

## 事件类型

### OneBot 事件
```typescript
app.useMw(async (ctx, next) => {
  const event = ctx.event
  
  switch (event.type) {
    case 'message':
      // 处理消息
      break
    case 'notice':
      // 处理通知
      break
    case 'request':
      // 处理请求
      break
  }
  
  await next()
})
```

### Cron 事件
```typescript
app.useJob('0 */6 * * *', async (ctx) => {
  // 每 6 小时执行一次
  console.log('定时任务执行时间:', ctx.event.timestamp)
})
```

### Webhook 事件
```typescript
app.useWebhook('custom', async (ctx) => {
  const payload = ctx.event.payload
  // 处理自定义 webhook 数据
})
```

## 高级用法

### 自定义中间件工厂
```typescript
function createRateLimit(maxRequests: number) {
  const requests = new Map()
  
  return async (ctx, next) => {
    const userId = ctx.event.user_id
    const now = Date.now()
    const userRequests = requests.get(userId) || []
    
    // 清理过期请求
    const validRequests = userRequests.filter((time: number) => now - time < 60000)
    
    if (validRequests.length >= maxRequests) {
      await ctx.send('请求过于频繁，请稍后再试')
      return
    }
    
    validRequests.push(now)
    requests.set(userId, validRequests)
    
    await next()
  }
}

app.useMw(createRateLimit(10)) // 每分钟最多 10 次请求
```

### 条件中间件
```typescript
function when(condition: (ctx: Context) => boolean, middleware: Middleware) {
  return async (ctx, next) => {
    if (condition(ctx)) {
      await middleware(ctx, next)
    } else {
      await next()
    }
  }
}

// 只在群聊中生效
app.useMw(
  when(
    (ctx) => ctx.event.message_type === 'group',
    async (ctx, next) => {
      // 群聊专用逻辑
      await next()
    }
  )
)
```

## 文档

更多详细文档请查看 [docs/](./docs/) 目录。

## 许可证

AGPL-3.0
