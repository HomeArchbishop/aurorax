# 设计决策

记录框架核心设计选择的原因，帮助开发者理解代码背后的意图。

## 触发器 + 管道分离

事件的"接收"和"处理"被拆成两层：触发层（Trigger）负责监听外部来源并分发，管道层（Pipeline）负责执行用户代码。

这样做的好处是两层各司其职：

- `Trigger` 只关心什么时候触发、触发哪条管道，不涉及如何执行
- `Pipeline` 只关心如何执行用户代码、如何构造 Context，不涉及事件来源

如果将来需要支持新的触发方式（比如 MQTT、WebSocket 客户端），只需新增一个 `Trigger` 实现，管道层完全不用改动。

## MiddlewarePipeline 的链式结构而非中间件数组

注册 `n` 个中间件时，框架创建 `n` 个 `MiddlewarePipeline` 实例，通过 `pipeTo()` 串联，而不是维护一个中间件函数数组然后在 `execute` 时循环调用。

这样每个 Pipeline 实例对自己的元信息（名称、index）是自包含的，日志追踪更精确：

```
middleware#0`loggerMw` for onebot_event#a3f9b2 start
middleware#1`authMw` for onebot_event#a3f9b2 start
middleware#1`authMw` for onebot_event#a3f9b2 end
middleware#0`loggerMw` for onebot_event#a3f9b2 end
```

代价是：每次 `useMw()` 都分配一个对象，相比数组有轻微内存开销，但对于 Bot 场景下的调用频率完全可以接受。

## `next()` 用 `once()` 包装

`MiddlewarePipeline.execute` 中的 `next` 函数被 `once()` 包装：

```typescript
const next = once(async () => { await this.#nextPipeline?.execute(event, meta) })
```

`once()` 保证 `next()` 在一次执行中只能被调用一次，第二次调用会抛出错误。这与 Koa 的行为一致，防止中间件意外多次触发下游。

## `queueUntil` 缓冲启动前的事件

`OnebotTrigger` 在 `connect()` 阶段就注册了 `onebot-event` 监听，但此时 `start()` 还没被调用。用 `queueUntil(() => this.#started, callback)` 包装监听器，确保在 `start()` 前到达的事件不会丢失，而是缓冲后按序执行。

`CronTrigger` 和 `WebhookTrigger` 不需要这个机制：两者都在 `start()` 时才注册监听，不存在提前到达的问题。

## `echo` 机制处理异步 API 响应

OneBot 协议的 API 调用是异步的：发出请求后，响应通过同一条 WebSocket 连接异步返回，只能靠 `echo` 字段匹配。`OnebotApiCallbackHub` 维护一个 `echo → callback` 的 Map，收到响应时根据 `echo` 找到对应回调执行。

`echo` 由 `Math.random().toString(36).slice(2, 10)` 生成，足够随机，不需要严格唯一性保证（碰撞概率极低且后果只是回调错乱，不影响进程稳定性）。

## `OnebotBridge.send` 的传递方式

`Pipeline` 构造时接收 `onebotBridge`，`execute` 时将 `onebotBridge.send` 直接赋值到 `ctx.send`：

```typescript
const ctx: Context<OnebotEvent> = {
  send: this.#onebotBridge.send,
  event,
}
```

三种管道（Middleware / Job / Webhook）都通过这种方式共用同一个 `send` 实现。这样 `send` 的来源对用户代码完全透明，不需要区分自己处在哪种管道中。

## `App` 直接创建具体实现，不做依赖注入

`App` 的构造函数根据 `options.onebot.type` 直接创建 `WsReverseOnebotBridge` 的具体实例，而不是通过接口注入。

这是有意为之的取舍：框架目前只有一种 OneBot 接入方式（`ws-reverse`），引入 DI 容器或工厂抽象只会增加复杂度，带来的灵活性没有实际用处。如果将来需要支持更多接入方式，再做抽象也不迟——代码现在的结构（`createOnebotBridge` 工厂函数 + `OnebotBridgeType` 字面量联合类型）已经预留了这个扩展点。

## 管道层统一吞掉异常

三种 Pipeline 都在内部 `try/catch`，捕获用户代码的异常后记录日志，不向上抛出。触发层调用 `pipeline.execute()` 时不 `await`（`.catch(() => null)` 静默处理），确保一个管道的崩溃不影响其他管道。

代价是用户代码的异常如果没有在中间件里自行处理，会静默消失（只留日志）。这对 Bot 场景是合理的默认——一条消息处理失败不应该阻塞后续消息。开发者如果需要感知异常，应该在最外层中间件用 `try/catch` 自行处理。
