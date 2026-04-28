# 教程 03：事件处理

> **目标**：学习如何在中间件中区分事件类型、读取事件字段、调用 OneBot API 发送回复。

> **关于事件字段**：本教程只展示框架用法。具体的事件结构、字段含义、所有 `notice_type` / `request_type` / 消息段类型等，请查阅 [OneBot 11 协议文档](https://github.com/botuniverse/onebot-11)。

## 通过 `post_type` 区分事件

`ctx.event` 就是 OneBot 11 协议原始的事件对象，Aurorax 没有对它做任何改造，直接原样放在这里。因此协议里事件有什么字段，`ctx.event` 就有什么字段。`post_type` 是 OneBot 11 协议中所有事件共有的顶层字段，利用它过滤出感兴趣的事件：

```typescript
app.useMw(async (ctx, next) => {
  const event = ctx.event

  if (event.post_type === 'message') {
    // 消息事件
  } else if (event.post_type === 'notice') {
    // 通知事件
  } else if (event.post_type === 'request') {
    // 请求事件
  }

  await next()
})
```

## 处理私聊消息

```typescript
app.useMw(async (ctx, next) => {
  const event = ctx.event

  if (event.post_type !== 'message' || event.message_type !== 'private') {
    return await next()
  }

  // TypeScript 已将 event 收窄为 PrivateMessageEvent
  console.log(`私聊来自 ${event.sender.nickname}(${event.user_id}): ${event.raw_message}`)

  ctx.send({
    action: 'send_private_msg',
    params: { user_id: event.user_id, message: `你说了：${event.raw_message}` }
  })

  await next()
})
```

## 处理群聊消息

```typescript
app.useMw(async (ctx, next) => {
  const event = ctx.event

  if (event.post_type !== 'message' || event.message_type !== 'group') {
    return await next()
  }

  if (event.raw_message === '/status') {
    ctx.send({
      action: 'send_group_msg',
      params: { group_id: event.group_id, message: 'Bot 运行正常 ✅' }
    })
  }

  await next()
})
```

## 处理通知与请求事件

通知事件（`post_type === 'notice'`）和请求事件（`post_type === 'request'`）的处理方式相同——先判断类型，再按需调用 API：

```typescript
app.useMw(async (ctx, next) => {
  const event = ctx.event

  if (event.post_type === 'notice' && event.notice_type === 'group_increase') {
    ctx.send({
      action: 'send_group_msg',
      params: { group_id: event.group_id, message: `欢迎新成员 ${event.user_id}！` }
    })
  }

  if (event.post_type === 'request' && event.request_type === 'friend') {
    ctx.send({
      action: 'set_friend_add_request',
      params: { flag: event.flag, approve: true }
    })
  }

  await next()
})
```

> 完整的 `notice_type`、`request_type` 及其子类型列表，参见 [OneBot 11 事件文档](https://github.com/botuniverse/onebot-11/blob/master/event/README.md)。

## 发送消息

`ctx.send` 的 `params.message` 接受字符串或 OneBot 消息段（CQ 码对应的对象格式）：

```typescript
// 纯文本
ctx.send({ action: 'send_group_msg', params: { group_id: 123456, message: '普通文字' } })

// 消息段数组（格式遵循 OneBot 11 消息段规范）
ctx.send({
  action: 'send_group_msg',
  params: {
    group_id: 123456,
    message: [
      { type: 'at', data: { qq: String(userId) } },
      { type: 'text', data: { text: ' 你好！' } }
    ]
  }
})
```

> 消息段的完整类型（`image`、`record`、`at`、`reply` 等）及字段说明，参见 [OneBot 11 消息段文档](https://github.com/botuniverse/onebot-11/blob/master/message/segment.md)。

## 使用 API 回调

`ctx.send` 的第二、三个参数分别是成功和失败回调，可获取 API 返回值：

```typescript
ctx.send(
  { action: 'send_private_msg', params: { user_id: 123456, message: '测试' } },
  (res) => console.log('消息 ID:', res.data?.message_id),
  (res) => console.error('发送失败:', res.message)
)
```

> 各 API 的入参和返回值结构，参见 [OneBot 11 API 文档](https://github.com/botuniverse/onebot-11/blob/master/api/public.md)。

---

## 下一步

- [教程 04：定时任务](./04-cron-jobs.md) — 用 cron 表达式定时执行任务
