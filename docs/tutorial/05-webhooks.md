# 教程 05：Webhook 集成

> **目标**：通过内置 HTTP 服务器接收来自 GitHub、GitLab 等外部服务的 Webhook 推送，并将通知发送到 QQ 群。

有时候触发 Bot 的不是用户，而是外部系统——有人往 GitHub 推了代码，Bot 就在群里通知一声；服务器报警了，Bot 立刻 @ 相关人员。Aurorax 为此内置了一个 HTTP 服务器：你在代码里注册好处理器，框架启动后这个服务器就开始监听；GitHub、GitLab 或任何能发 HTTP 请求的系统，向它的地址发一个 POST，对应的处理器就会触发。

## 启用 Webhook 服务器

在 `App` 配置中加入 `webhook` 选项：

```typescript
const app = new App({
  onebot: {
    type: 'ws-reverse',
    url: 'ws://localhost:8080'
  },
  webhook: {
    port: 3000,           // HTTP 监听端口
    tokens: ['my-secret'] // 鉴权 Token 列表（可配置多个）
  }
})
```

只有注册了至少一个 Webhook 处理器，HTTP 服务器才会启动。

## 注册处理器

```typescript
app.useWebhook('webhookId', async (ctx) => {
  // ...
})
```

Webhook 请求的 URL 格式为：

```
POST http://your-server:3000/{webhookId}?token=my-secret
```

### ctx 详解

**`ctx.event`** — 描述本次 HTTP 请求的信息：

| 字段 | 类型 | 说明 |
|------|------|------|
| `webhookId` | `string` | 注册时传入的标识符，即 URL 路径中的 `{webhookId}` |
| `query` | `URLSearchParams` | URL 查询参数，常用于取 `token` 做鉴权 |
| `body` | `ArrayBuffer` | 原始请求体的二进制数据，需要手动解码 |

读取 JSON 请求体的标准做法：

```typescript
const payload = JSON.parse(new TextDecoder().decode(ctx.event.body))
```

读取查询参数：

```typescript
const token = ctx.event.query.get('token')  // 取单个参数
```

**`ctx.send(req, onSuccess?, onFailure?)`** — 与中间件中完全相同，调用 OneBot API 发消息或执行操作。Webhook 处理器也没有 `next()`，每个 `webhookId` 对应独立处理器。

## 接收 GitHub Push 通知

### 1. 注册处理器

```typescript
const NOTIFY_GROUP = 123456789

app.useWebhook('github', async (ctx) => {
  const raw = new TextDecoder().decode(ctx.event.body)
  const payload = JSON.parse(raw)

  // 只处理推送到 main 分支的事件
  if (payload.ref !== 'refs/heads/main') return

  const repo = payload.repository.full_name
  const pusher = payload.pusher.name
  const commits: any[] = payload.commits ?? []
  const count = commits.length

  const summary = commits
    .slice(0, 3)
    .map((c: any) => `  • ${c.message.split('\n')[0]}`)
    .join('\n')

  ctx.send({
    action: 'send_group_msg',
    params: {
      group_id: NOTIFY_GROUP,
      message: `🔔 [${repo}] ${pusher} 推送了 ${count} 个提交到 main\n${summary}`
    }
  })
})

await app.start()
```

### 2. 在 GitHub 上配置 Webhook

进入仓库 → **Settings** → **Webhooks** → **Add webhook**：

| 字段 | 值 |
|------|----|
| Payload URL | `http://your-server:3000/github?token=my-secret` |
| Content type | `application/json` |
| Events | `Just the push event` |

## 接收 GitLab Push 通知

```typescript
app.useWebhook('gitlab', async (ctx) => {
  const token = ctx.event.query.get('token')
  if (token !== 'my-secret') return  // 二次验证

  const payload = JSON.parse(new TextDecoder().decode(ctx.event.body))

  if (payload.object_kind !== 'push') return

  const branch = (payload.ref as string).replace('refs/heads/', '')
  const user = payload.user_name
  const project = payload.project.name

  ctx.send({
    action: 'send_group_msg',
    params: {
      group_id: NOTIFY_GROUP,
      message: `🦊 [${project}] ${user} 推送到 ${branch} 分支`
    }
  })
})
```

## 自定义 Webhook

任何能发送 HTTP POST 请求的服务都可以对接：

```typescript
app.useWebhook('alert', async (ctx) => {
  const payload = JSON.parse(new TextDecoder().decode(ctx.event.body))

  // 示例：接收 Prometheus Alertmanager 告警
  for (const alert of payload.alerts ?? []) {
    const status = alert.status === 'firing' ? '🔴 告警' : '✅ 恢复'
    const name = alert.labels?.alertname ?? '未知告警'

    ctx.send({
      action: 'send_group_msg',
      params: {
        group_id: NOTIFY_GROUP,
        message: `${status}: ${name}`
      }
    })
  }
})
```

对应的告警推送命令（测试用）：

```bash
curl -X POST "http://localhost:3000/alert?token=my-secret" \
  -H "Content-Type: application/json" \
  -d '{"alerts":[{"status":"firing","labels":{"alertname":"HighCPU"}}]}'
```

## 与中间件、定时任务组合

三种处理器可以混合使用：

```typescript
app
  .useMw(errorBoundary)
  .useMw(privateMessageHandler)
  .useJob('0 8 * * *', morningReport)
  .useWebhook('github', githubNotify)
  .useWebhook('gitlab', gitlabNotify)

await app.start()
```

---

## 总结

| 处理器 | API | 触发方式 | 典型场景 |
|--------|-----|---------|---------|
| 中间件 | `useMw` | OneBot 实时事件 | 响应用户消息、指令 |
| 定时任务 | `useJob` | Cron 定时 | 早报、健康检查 |
| Webhook | `useWebhook` | HTTP POST | CI/CD 通知、告警推送 |

恭喜！你已完成全部基础教程。进一步探索：

- [架构概览](../dev/architecture-overview.md) — 了解框架内部工作原理
- [接口与组件](../dev/interfaces-and-components.md) — 完整的类型定义参考
