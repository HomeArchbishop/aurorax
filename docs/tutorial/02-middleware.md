# 教程 02：中间件模式

> **目标**：掌握 Aurorax 中间件的执行顺序、`next()` 控制流，以及常用中间件工厂模式。

简单来说，用户发了一条消息，你的 Bot 要做出反应——这就是中间件的用武之地。你在群里说"天气"，Bot 回你今天的天气预报；你发了一张图，Bot 自动识别内容——这些"收到消息 → 做某件事"的逻辑，都写在中间件里。

## 中间件是什么？

中间件是一个异步函数，签名如下：

```typescript
type Middleware = (
  ctx: Readonly<Context<OnebotEvent>>,
  next: () => Promise<void>
) => Promise<void>
```

### ctx 详解

> `ctx.event` 和 `ctx.send` 本质上是对 OneBot 11 协议的直接封装——前者是协议定义的事件数据，后者是协议定义的 API 调用。因此在编写业务逻辑之前，建议先对 [OneBot 11 协议](https://github.com/botuniverse/onebot-11) 有个大概的了解，知道协议里有哪些事件类型、能调哪些 API，才能清楚地知道自己在操作什么。

`ctx` 有两个属性：

**`ctx.event`** — OneBot 11 协议的原始事件对象（只读）。Aurorax 没有对它做任何改造，协议里事件有什么字段，这里就有什么字段。

**`ctx.send(req, onSuccess?, onFailure?)`** — 向 OneBot 发送 API 调用请求：

```typescript
ctx.send({
  action: 'send_private_msg',   // API 名称
  params: {
    user_id: 123456,
    message: '你好'
  }
})
```

`onSuccess` 和 `onFailure` 是可选的回调函数，用于获取 API 返回值。

**`next()`** — 调用后将控制权交给下一个中间件；不调用则中断链路。

## 执行顺序

Aurorax 中间件的执行模型与 Koa 完全一致，形成"洋葱"结构：

```
         ┌─ 中间件 A ─────────────────────────────┐
         │  ┌─ 中间件 B ─────────────────────┐    │
         │  │  ┌─ 中间件 C ─────────────┐    │    │
收到事件 ──►│  │  │      处理逻辑        │    │    │
         │  │  └────────────────────────┘    │    │
         │  └───────────────────────────────┘    │
         └────────────────────────────────────────┘
```

```typescript
app.useMw(async (ctx, next) => {
  console.log('A: 进入')
  await next()              // 等待后续中间件完成
  console.log('A: 退出')
})

app.useMw(async (ctx, next) => {
  console.log('B: 进入')
  await next()
  console.log('B: 退出')
})

app.useMw(async (ctx, next) => {
  console.log('C: 进入')
  await next()
  console.log('C: 退出')
})
```

收到事件时，控制台输出顺序为：

```
A: 进入
B: 进入
C: 进入
C: 退出
B: 退出
A: 退出
```

## 中断链路

不调用 `next()` 即可阻止后续中间件执行：

```typescript
app.useMw(async (ctx, next) => {
  if (ctx.event.post_type !== 'message') return  // 非消息事件直接忽略
  await next()
})
```

## 实用中间件模式

### 错误边界

将错误处理放在链路最前端，捕获所有后续中间件的异常：

```typescript
app.useMw(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    console.error('[错误]', err)
    // 可选：通知用户
    if (ctx.event.post_type === 'message' && ctx.event.message_type === 'private') {
      ctx.send({
        action: 'send_private_msg',
        params: { user_id: ctx.event.user_id, message: '系统繁忙，请稍后再试' }
      })
    }
  }
})
```

### 计时器

测量下游中间件的处理耗时：

```typescript
app.useMw(async (ctx, next) => {
  const start = Date.now()
  await next()
  console.log(`处理耗时: ${Date.now() - start}ms`)
})
```

### 中间件工厂

通过工厂函数创建参数化中间件：

```typescript
import type { Middleware } from 'aurorax'

function onlyMessage(): Middleware {
  return async (ctx, next) => {
    if (ctx.event.post_type === 'message') {
      await next()
    }
    // 非消息事件不调用 next，静默丢弃
  }
}

function onlyPrivate(): Middleware {
  return async (ctx, next) => {
    if (ctx.event.post_type === 'message' && ctx.event.message_type === 'private') {
      await next()
    }
  }
}

// 组合使用：先过滤类型，再处理业务
app
  .useMw(onlyMessage())
  .useMw(onlyPrivate())
  .useMw(async (ctx, next) => {
    // 此处保证是私聊消息事件
    console.log('私聊消息:', ctx.event.raw_message)
    await next()
  })
```

### 限流中间件

```typescript
import type { Middleware, OnebotEvent } from 'aurorax'

function rateLimit(maxPerMinute: number): Middleware {
  const counters = new Map<number, number[]>()

  return async (ctx, next) => {
    if (ctx.event.post_type !== 'message') {
      await next()
      return
    }

    const uid = ctx.event.user_id
    const now = Date.now()
    const hits = (counters.get(uid) ?? []).filter(t => now - t < 60_000)

    if (hits.length >= maxPerMinute) {
      ctx.send({
        action: 'send_private_msg',
        params: { user_id: uid, message: '操作过于频繁，请稍后再试' }
      })
      return
    }

    counters.set(uid, [...hits, now])
    await next()
  }
}

app.useMw(rateLimit(5))  // 每个用户每分钟最多 5 次
```

## 链式注册

`useMw` 返回 `this`，支持链式调用：

```typescript
app
  .useMw(errorBoundary)
  .useMw(timer)
  .useMw(rateLimit(10))
  .useMw(businessLogic)
```

---

## 下一步

- [教程 03：事件处理](./03-event-handling.md) — 区分并处理消息、通知、请求等不同事件类型
