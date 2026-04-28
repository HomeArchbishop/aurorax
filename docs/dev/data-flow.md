# 数据流

## OneBot 事件流

```mermaid
sequenceDiagram
    participant OB as OneBot 实现
    participant Bridge as WsReverseOnebotBridge
    participant OT as OnebotTrigger
    participant MP as MiddlewarePipeline
    participant User as 用户中间件

    OB->>Bridge: WebSocket 消息（JSON 字符串）
    Bridge->>Bridge: JSON.parse
    alt 含 status 字段（API 响应）
        Bridge->>Bridge: OnebotApiCallbackHub.trigger(echo, res)
        Note right of Bridge: 触发对应的 onSuccess / onFailure 回调
    else 无 status 字段（OneBot 事件）
        Bridge->>OT: emit('onebot-event', event)
        OT->>OT: queueUntil 检查：是否已 started？
        OT->>MP: pipeline.execute(event, { hash: uid() })
        MP->>MP: 构造 ctx = { send: bridge.send, event }
        MP->>User: middleware(ctx, next)
        User-->>MP: await next() → 调用 nextPipeline.execute
        MP-->>OT: 执行完成
    end
```

**鉴权**：`App` 向 OneBot 建立 WebSocket 连接时，若配置了 `token`，会在握手请求头中携带 `Authorization: Bearer <token>`。

**事件缓冲**：`OnebotTrigger.connect()` 时用 `queueUntil(() => this.#started, callback)` 包装事件监听器。`start()` 被调用前，所有到达的事件会缓冲在队列中，`start()` 后批量执行，确保不丢弃启动窗口期的事件。

---

## Webhook 事件流

```mermaid
sequenceDiagram
    participant Client as HTTP 客户端
    participant WS as WebhookServer
    participant WT as WebhookTrigger
    participant WP as WebhookPipeline
    participant User as 用户处理函数

    Client->>WS: POST /webhook/{webhookId}
    WS->>WS: 检查路径格式 /webhook/[^/]+
    WS->>WS: 鉴权：tokens.includes(headers.authorization)
    alt 鉴权失败
        WS-->>Client: 401 Unauthorized
    else 鉴权通过
        WS->>WS: 读取 body → ArrayBuffer
        WS->>WS: 构造 WebhookEvent { webhookId, query, body }
        WS->>WT: emit('webhook-event', event)
        WT->>WT: 遍历 pipelineGroups，找 condition(event) 为 true 的
        WT->>WP: pipeline.execute(event, { hash: uid() })
        WP->>WP: 构造 ctx = { send: bridge.send, event }
        WP->>User: webhook(ctx)
        User-->>WP: 执行完成
        WP-->>WS: 无异常
        WS-->>Client: 200 Webhook processed successfully
    end
```

**鉴权说明**：`WebhookServer` 检查 HTTP 请求的 `Authorization` 请求头，与初始化时传入的 `tokens` 数组做 `includes` 比较。若 `tokens` 为空数组则跳过鉴权。

**路由**：`WebhookTrigger` 为每个 `webhookId` 存储一个 `condition: (event) => event.webhookId === branchWebhookId`。收到事件后遍历所有 pipelineGroup，匹配的才执行。未匹配则抛出错误，WebhookServer 返回 500。

---

## 定时任务流

```mermaid
sequenceDiagram
    participant NS as node-schedule
    participant CT as CronTrigger
    participant JP as JobPipeline
    participant User as 用户 Job 函数

    Note over CT: start() 时为每个唯一 spec 注册 scheduleJob
    NS->>CT: spec 匹配，触发回调
    CT->>CT: 构造 CronEvent { spec, timestamp: Date.now() }
    CT->>CT: 遍历 pipelineGroups，找 condition(event) 为 true 的
    CT->>JP: pipeline.execute(event, { hash: uid() })
    JP->>JP: 构造 ctx = { send: bridge.send, event }
    JP->>User: job(ctx)
    User-->>JP: 执行完成
```

**Spec 去重**：`CronTrigger` 维护一个 `#specs: Set<Spec>`，同一 spec 只注册一个 `scheduleJob`。当多个 Job 使用相同 spec 时，触发器统一响应，并通过 `condition` 分发到各自的管道。

---

## API 响应回调流

`ctx.send` 调用后，请求通过 WebSocket 发出，响应通过 `OnebotApiCallbackHub` 异步回调：

```mermaid
sequenceDiagram
    participant User as 用户代码
    participant Bridge as WsReverseOnebotBridge
    participant Hub as OnebotApiCallbackHub
    participant OB as OneBot 实现

    User->>Bridge: ctx.send({ action, params }, onSuccess, onFailure)
    Bridge->>Bridge: 生成 echo（随机字符串）
    Bridge->>Hub: hub.use(echo, onSuccess, onFailure)
    Bridge->>OB: WebSocket 发送 { action, params, echo }
    OB-->>Bridge: WebSocket 响应 { status, data, echo }
    Bridge->>Hub: hub.trigger(echo, res)
    alt status === 'ok'
        Hub->>User: 调用 onSuccess(res)
    else status === 'failed'
        Hub->>User: 调用 onFailure(res)
    end
```

---

## 错误处理

管道层统一捕获用户代码抛出的异常并写入日志，不会向上传播导致进程崩溃：

```typescript
// 三种 Pipeline 的共同模式
try {
  await this.#middleware(ctx, next)   // 或 #job / #webhook
} catch (err) {
  if (err instanceof Error) {
    logger.error(identifier + ' error: ' + err.message)
    logger.error(err.stack)
  } else {
    logger.error(identifier + ' error: ' + String(err))
  }
}
```

触发层调用 `pipeline.execute()` 时不 `await`，错误由 `.catch(() => null)` 静默处理，确保单条管道的异常不阻塞同一事件的其他管道。
