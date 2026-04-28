# API 参考

本页面列出 `aurorax` 包的全部公开 API。

## App

### `new App(options)`

创建应用实例。

```typescript
import { App } from 'aurorax'

const app = new App({
  onebot: {
    type: 'ws-reverse',
    url: 'ws://localhost:8080/onebot/v11/ws',
    token: 'your-access-token' // 可选
  },
  webhook: {                   // 可选
    port: 3000,
    tokens: ['my-secret']
  }
})
```

**`AppOptions`**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `onebot.type` | `'ws-reverse'` | 是 | 连接类型，目前仅支持反向 WebSocket |
| `onebot.url` | `string` | 是 | WebSocket 监听地址 |
| `onebot.token` | `string` | 否 | OneBot 鉴权 Token |
| `webhook.port` | `number` | 否 | HTTP 服务器端口，默认 `3000` |
| `webhook.tokens` | `string[]` | 否 | 允许的鉴权 Token 列表 |

### `app.useMw(mw)`

注册一个中间件。返回 `this`，支持链式调用。

```typescript
app.useMw(async (ctx, next) => {
  console.log(ctx.event.post_type)
  await next()
})
```

| 参数 | 类型 |
|------|------|
| `mw` | [`Middleware`](#middleware) |

### `app.useJob(spec, job)`

注册一个定时任务。返回 `this`，支持链式调用。

```typescript
app.useJob('0 8 * * *', async (ctx) => {
  ctx.send({
    action: 'send_group_msg',
    params: { group_id: 123456, message: '早上好' }
  })
})
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `spec` | `string` | 标准 5 位 cron 表达式 |
| `job` | [`Job`](#job) | 任务处理函数 |

### `app.useWebhook(webhookId, webhook)`

注册一个 Webhook 处理器。返回 `this`，支持链式调用。

HTTP 请求格式：`POST http://host:port/{webhookId}?token=xxx`

```typescript
app.useWebhook('github', async (ctx) => {
  const payload = JSON.parse(new TextDecoder().decode(ctx.event.body))
  // ...
})
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `webhookId` | `string` | URL 路径标识符 |
| `webhook` | [`Webhook`](#webhook) | Webhook 处理函数 |

### `app.start()`

启动应用。建立 OneBot WebSocket 连接，启动定时任务调度器，若有 Webhook 处理器则启动 HTTP 服务器。

```typescript
await app.start()
```

返回 `Promise<void>`。

---

## 处理器类型

### `Middleware`

```typescript
type Middleware = (
  ctx: Readonly<Context<OnebotEvent>>,
  next: () => Promise<void>
) => Promise<void>
```

类 Koa 中间件。调用 `next()` 将控制权交给下一个中间件，不调用则终止链。

### `Job`

```typescript
type Job = (ctx: Readonly<Context<CronEvent>>) => Promise<void>
```

定时任务处理函数。没有 `next()`，每个任务独立执行。

### `Webhook`

```typescript
type Webhook = (ctx: Context<WebhookEvent>) => Promise<void>
```

Webhook 处理函数。没有 `next()`，每个 `webhookId` 对应独立处理器。

---

## Context\<E\>

所有处理器的上下文对象，泛型 `E` 为对应的事件类型。

```typescript
interface Context<E extends OnebotEvent | CronEvent | WebhookEvent> {
  readonly send: CtxSend
  readonly event: E
}
```

### `ctx.event`

当前事件数据，类型取决于处理器种类：

| 处理器 | 事件类型 | 说明 |
|--------|---------|------|
| 中间件 | [`OnebotEvent`](#onebotevent) | OneBot 推送的实时事件 |
| 定时任务 | [`CronEvent`](#cronevent) | 定时触发信息 |
| Webhook | [`WebhookEvent`](#webhookevent) | HTTP 请求信息 |

### `ctx.send(req, onSuccess?, onFailure?)`

调用 OneBot API。

```typescript
ctx.send<T extends ApiActionName>(
  req: { action: T, params: RequestParams<T> },
  onSuccess?: (res) => void,
  onFailure?: (res) => void
) => void
```

**示例：**

```typescript
ctx.send({
  action: 'send_group_msg',
  params: { group_id: 123456, message: 'hello' }
})

// 带回调
ctx.send(
  { action: 'send_private_msg', params: { user_id: 10001, message: 'hi' } },
  (res) => console.log('发送成功, message_id:', res.data.message_id),
  (res) => console.error('发送失败:', res.message)
)
```

---

## 事件类型

### OnebotEvent

OneBot 11 协议定义的事件，是以下四类的联合类型：

```typescript
type OnebotEvent = MessageEvent | NoticeEvent | RequestEvent | MetaEvent
```

#### MessageEvent

| 类型 | `message_type` | 关键字段 |
|------|---------------|---------|
| `PrivateMessageEvent` | `'private'` | `user_id`, `raw_message`, `message`, `sender` |
| `GroupMessageEvent` | `'group'` | `group_id`, `user_id`, `raw_message`, `message`, `sender`, `anonymous` |

公共字段：`time`, `self_id`, `post_type: 'message'`, `message_id`, `font`

**`message`** 字段类型为 `MessageSegmentReceive[]`，详见 [消息段](#消息段)。

#### NoticeEvent

| 类型 | `notice_type` | 关键字段 |
|------|--------------|---------|
| `FriendAddNoticeEvent` | `'friend_add'` | `user_id` |
| `FriendRecallNoticeEvent` | `'friend_recall'` | `user_id`, `message_id` |
| `GroupUploadNoticeEvent` | `'group_upload'` | `group_id`, `user_id`, `file` |
| `GroupAdminNoticeEvent` | `'group_admin'` | `group_id`, `user_id`, `sub_type` |
| `GroupDecreaseNoticeEvent` | `'group_decrease'` | `group_id`, `user_id`, `operator_id`, `sub_type` |
| `GroupIncreaseNoticeEvent` | `'group_increase'` | `group_id`, `user_id`, `operator_id`, `sub_type` |
| `GroupBanNoticeEvent` | `'group_ban'` | `group_id`, `user_id`, `operator_id`, `duration`, `sub_type` |
| `GroupRecallNoticeEvent` | `'group_recall'` | `group_id`, `user_id`, `operator_id`, `message_id` |
| `GroupPokeNoticeEvent` | `'notify'` (poke) | `group_id`, `user_id`, `target_id` |
| `GroupLuckyKingNoticeEvent` | `'notify'` (lucky_king) | `group_id`, `user_id`, `target_id` |
| `GroupHonorChangeNoticeEvent` | `'notify'` (honor) | `group_id`, `user_id`, `honor_type` |

#### RequestEvent

| 类型 | `request_type` | 关键字段 |
|------|---------------|---------|
| `FriendRequestEvent` | `'friend'` | `user_id`, `comment`, `flag` |
| `GroupRequestEvent` | `'group'` | `group_id`, `user_id`, `comment`, `flag`, `sub_type` |

#### MetaEvent

| 类型 | `meta_event_type` | 关键字段 |
|------|-------------------|---------|
| `LifecycleMetaEvent` | `'lifecycle'` | `sub_type: 'enable' \| 'disable' \| 'connect'` |
| `HeartbeatMetaEvent` | `'heartbeat'` | `status`, `interval` |

### CronEvent

```typescript
interface CronEvent {
  spec: string       // 触发该任务的 cron 表达式
  timestamp: number   // 触发时间戳（毫秒）
}
```

### WebhookEvent

```typescript
interface WebhookEvent {
  webhookId: string        // 注册时传入的标识符
  query: URLSearchParams   // URL 查询参数
  body: ArrayBuffer        // 原始请求体
}
```

读取 JSON 请求体：

```typescript
const payload = JSON.parse(new TextDecoder().decode(ctx.event.body))
```

---

## OneBot API

通过 `ctx.send()` 调用。`action` 字段指定 API 名称，`params` 字段传入参数。完整列表遵循 [OneBot 11 标准](https://github.com/botuniverse/onebot-11)，以下列出常用 API。

### 消息

| action | 参数 | 说明 |
|--------|------|------|
| `send_private_msg` | `user_id: number`, `message: MessageSend` | 发送私聊消息 |
| `send_group_msg` | `group_id: number`, `message: MessageSend` | 发送群消息 |
| `send_msg` | `message_type?`, `user_id?`, `group_id?`, `message` | 发送消息（通用） |
| `delete_msg` | `message_id: number` | 撤回消息 |
| `get_msg` | `message_id: number` | 获取消息 |
| `get_forward_msg` | `id: string` | 获取合并转发消息 |

### 好友操作

| action | 参数 | 说明 |
|--------|------|------|
| `send_like` | `user_id`, `times?` | 发送好友赞 |
| `set_friend_add_request` | `flag`, `approve?`, `remark?` | 处理加好友请求 |

### 群操作

| action | 参数 | 说明 |
|--------|------|------|
| `set_group_kick` | `group_id`, `user_id`, `reject_add_request?` | 群组踢人 |
| `set_group_ban` | `group_id`, `user_id`, `duration?` | 群组禁言 |
| `set_group_whole_ban` | `group_id`, `enable?` | 群组全员禁言 |
| `set_group_admin` | `group_id`, `user_id`, `enable?` | 设置管理员 |
| `set_group_card` | `group_id`, `user_id`, `card?` | 设置群名片 |
| `set_group_name` | `group_id`, `group_name` | 设置群名 |
| `set_group_leave` | `group_id`, `is_dismiss?` | 退出群组 |
| `set_group_add_request` | `flag`, `sub_type`, `approve?`, `reason?` | 处理加群请求 |

### 信息查询

| action | 参数 | 说明 |
|--------|------|------|
| `get_login_info` | 无 | 获取登录号信息 |
| `get_stranger_info` | `user_id`, `no_cache?` | 获取陌生人信息 |
| `get_friend_list` | 无 | 获取好友列表 |
| `get_group_info` | `group_id`, `no_cache?` | 获取群信息 |
| `get_group_list` | 无 | 获取群列表 |
| `get_group_member_info` | `group_id`, `user_id`, `no_cache?` | 获取群成员信息 |
| `get_group_member_list` | `group_id` | 获取群成员列表 |

---

## 消息段

`message` 字段使用 `MessageSend` 类型，可以是纯字符串或消息段数组：

```typescript
type MessageSend = string | MessageSegmentSend[] | MessageSegmentSend
```

### 常用消息段

| type | 数据字段 | 说明 |
|------|---------|------|
| `text` | `text: string` | 纯文本 |
| `face` | `id: string` | QQ 表情 |
| `image` | `file: string`, `type?`, `url?` | 图片 |
| `record` | `file: string`, `magic?` | 语音 |
| `video` | `file: string` | 短视频 |
| `at` | `qq: string` | @某人，`qq` 为 `'all'` 时 @全体 |
| `reply` | `id: string` | 回复 |
| `share` | `url`, `title`, `content?`, `image?` | 链接分享 |
| `music` | `type: 'qq' \| '163' \| 'xm' \| 'custom'`, ... | 音乐分享 |
| `json` | `data: string` | JSON 消息 |
| `xml` | `data: string` | XML 消息 |
| `file` | `file: string`, `name?` | 文件 |

**示例：发送图文混合消息**

```typescript
ctx.send({
  action: 'send_group_msg',
  params: {
    group_id: 123456,
    message: [
      { type: 'text', data: { text: '看这张图：' } },
      { type: 'image', data: { file: 'https://example.com/pic.jpg' } }
    ]
  }
})
```
