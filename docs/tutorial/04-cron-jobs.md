# 教程 04：定时任务

> **目标**：使用 `app.useJob()` 和 cron 表达式实现定时推送、周期检查等场景。

有些事情不需要用户开口，Bot 自己就该去做——每天早上八点发一条早报，每周一提醒大家周会，整点报时。这类"到时间就执行"的任务（Job），用定时任务来写。

## 基本用法

```typescript
app.useJob('Cron 表达式', async (ctx) => {
  // ...
})
```

`useJob` 返回 `this`，支持链式注册多个定时任务。

### ctx 详解

Job 的 `ctx` 同样有两个属性：

**`ctx.event`** — 描述本次触发的定时信息：

| 字段 | 类型 | 说明 |
|------|------|------|
| `timestamp` | `number` | 触发时间戳（毫秒），可直接传给 `new Date()` |
| `spec` | `string` | 触发本次任务的 cron 表达式 |

```typescript
app.useJob('0 9 * * *', async (ctx) => {
  const now = new Date(ctx.event.timestamp)
  console.log(`触发时间: ${now.toLocaleString('zh-CN')}`)
  console.log(`来自规则: ${ctx.event.spec}`)  // '0 9 * * *'
})
```

**`ctx.send(req, onSuccess?, onFailure?)`** — 与中间件中的 `ctx.send` 完全相同，用于调用 OneBot API 发送消息或执行操作。Job 里没有 `next()`，每个任务独立执行。

## Cron 表达式速查

Aurorax 使用标准 5 字段 cron 语法：

```
┌─── 分钟 (0-59)
│  ┌─── 小时 (0-23)
│  │  ┌─── 日 (1-31)
│  │  │  ┌─── 月 (1-12)
│  │  │  │  ┌─── 星期 (0-7, 0 和 7 均表示周日)
│  │  │  │  │
*  *  *  *  *
```

| 表达式 | 含义 |
|--------|------|
| `0 9 * * *` | 每天上午 9:00 |
| `0 9 * * 1-5` | 工作日上午 9:00 |
| `*/5 * * * *` | 每 5 分钟 |
| `0 */2 * * *` | 每 2 小时整点 |
| `0 8 1 * *` | 每月 1 日早 8:00 |
| `30 17 * * 5` | 每周五下午 17:30 |

## 常见场景

### 每日早报推送

```typescript
const NOTIFY_GROUP = 123456789

app.useJob('0 8 * * *', async (ctx) => {
  const date = new Date(ctx.event.timestamp).toLocaleDateString('zh-CN')

  ctx.send({
    action: 'send_group_msg',
    params: {
      group_id: NOTIFY_GROUP,
      message: `📅 早安！今天是 ${date}，祝大家一天顺利～`
    }
  })
})
```

### 周期性状态检查

```typescript
// 每 10 分钟检查一次，模拟外部服务健康监测
app.useJob('*/10 * * * *', async (ctx) => {
  const time = new Date(ctx.event.timestamp).toLocaleTimeString('zh-CN')
  console.log(`[${time}] 执行健康检查...`)

  try {
    // 在此调用你的检查逻辑，例如 fetch 某个接口
    // const ok = await checkService()
    // if (!ok) alert(...)
  } catch (err) {
    console.error('健康检查异常:', err)
  }
})
```

### 工作日提醒

```typescript
// 工作日 18:00 下班提醒
app.useJob('0 18 * * 1-5', async (ctx) => {
  ctx.send({
    action: 'send_group_msg',
    params: {
      group_id: NOTIFY_GROUP,
      message: '🕕 下班时间到！记得打卡！'
    }
  })
})
```

### 月末报表

```typescript
// 每月最后一天 23:00（用第 28 天保证每月都有，或结合代码判断实际月末）
app.useJob('0 23 28-31 * *', async (ctx) => {
  const now = new Date(ctx.event.timestamp)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  // 判断明天是否是新月第一天
  if (tomorrow.getDate() === 1) {
    const month = now.getMonth() + 1
    ctx.send({
      action: 'send_group_msg',
      params: {
        group_id: NOTIFY_GROUP,
        message: `📊 ${month} 月即将结束，请完成本月汇总！`
      }
    })
  }
})
```

## 注册多个任务

```typescript
app
  .useJob('0 8 * * *',   morningGreeting)
  .useJob('0 12 * * *',  noonReminder)
  .useJob('0 18 * * *',  eveningReport)
  .useJob('*/30 * * * *', healthCheck)
```

## Job 与中间件的区别

| 特性 | `useMw` | `useJob` |
|------|---------|----------|
| 触发来源 | OneBot 事件（实时） | Cron 定时器 |
| `ctx.event` 类型 | `OnebotEvent` | `CronEvent` |
| 是否有 `next()` | 是（中间件链） | 否（独立执行） |
| 典型用途 | 响应用户消息 | 定时推送、巡检 |

---

## 下一步

- [教程 05：Webhook 集成](./05-webhooks.md) — 接入 GitHub、自定义 HTTP 推送等外部服务
