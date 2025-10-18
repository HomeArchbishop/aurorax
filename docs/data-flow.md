# 数据流图

## 整体数据流图

```mermaid
flowchart TD
    subgraph "外部数据源"
        OnebotEvents[Onebot 事件]
        WebhookRequests[Webhook 请求]
        CronSchedules[定时任务调度]
    end

    subgraph "Aurorax 数据流处理"
        subgraph "事件接收层"
            OnebotWS[WebSocket 连接]
            WebhookHTTP[HTTP 服务器]
            CronTimer[定时器]
        end

        subgraph "事件转换层"
            OnebotEvent[OnebotEvent 对象]
            WebhookEvent[WebhookEvent 对象]
            CronEvent[CronEvent 对象]
        end

        subgraph "触发器分发层"
            OnebotTrigger[Onebot 触发器]
            WebhookTrigger[Webhook 触发器]
            CronTrigger[定时任务触发器]
        end

        subgraph "管道处理层"
            MiddlewareChain[中间件链]
            JobHandler[任务处理器]
            WebhookHandler[Webhook 处理器]
        end

        subgraph "用户代码层"
            UserMiddleware[用户中间件]
            UserJob[用户任务]
            UserWebhook[用户 Webhook]
        end

        subgraph "API 调用层"
            OnebotAPI[Onebot API 调用]
            ExternalAPI[外部 API 调用]
        end
    end

    subgraph "外部响应"
        OnebotResponse[Onebot 响应]
        WebhookResponse[Webhook 响应]
    end

    %% 数据流连接
    OnebotEvents -->|WebSocket| OnebotWS
    WebhookRequests -->|HTTP POST| WebhookHTTP
    CronSchedules -->|定时触发| CronTimer

    OnebotWS --> OnebotEvent
    WebhookHTTP --> WebhookEvent
    CronTimer --> CronEvent

    OnebotEvent --> OnebotTrigger
    WebhookEvent --> WebhookTrigger
    CronEvent --> CronTrigger

    OnebotTrigger --> MiddlewareChain
    WebhookTrigger --> WebhookHandler
    CronTrigger --> JobHandler

    MiddlewareChain --> UserMiddleware
    JobHandler --> UserJob
    WebhookHandler --> UserWebhook

    UserMiddleware --> OnebotAPI
    UserJob --> OnebotAPI
    UserWebhook --> OnebotAPI
    UserWebhook --> ExternalAPI

    OnebotAPI --> OnebotResponse
    WebhookHandler --> WebhookResponse

    %% 样式
    classDef external fill:#e3f2fd
    classDef receive fill:#f3e5f5
    classDef transform fill:#e8f5e8
    classDef trigger fill:#fff3e0
    classDef pipeline fill:#fce4ec
    classDef user fill:#fff8e1
    classDef api fill:#f1f8e9
    classDef response fill:#e0f2f1

    class OnebotEvents,WebhookRequests,CronSchedules external
    class OnebotWS,WebhookHTTP,CronTimer receive
    class OnebotEvent,WebhookEvent,CronEvent transform
    class OnebotTrigger,WebhookTrigger,CronTrigger trigger
    class MiddlewareChain,JobHandler,WebhookHandler pipeline
    class UserMiddleware,UserJob,UserWebhook user
    class OnebotAPI,ExternalAPI api
    class OnebotResponse,WebhookResponse response
```

## 详细数据流说明

### 1. Onebot 事件流

```mermaid
sequenceDiagram
    participant OB as Onebot 机器人
    participant WS as WebSocket 连接
    participant OT as Onebot 触发器
    participant MP as 中间件管道
    participant UM as 用户中间件
    participant API as Onebot API

    OB->>WS: 发送事件 (JSON)
    WS->>OT: 触发事件监听
    OT->>MP: 创建 OnebotEvent 对象
    MP->>UM: 调用中间件函数
    UM->>API: 调用 Onebot API
    API->>OB: 发送 API 请求
    OB-->>API: 返回 API 响应
    API-->>UM: 返回响应结果
    UM-->>MP: 中间件执行完成
    MP-->>OT: 管道执行完成
```

### 2. Webhook 事件流

```mermaid
sequenceDiagram
    participant WC as Webhook 客户端
    participant HS as Webhook 服务器
    participant WT as Webhook 触发器
    participant WP as Webhook 管道
    participant UW as 用户 Webhook
    participant API as 外部 API

    WC->>HS: POST /webhook/:id
    HS->>HS: 验证 Token
    HS->>WT: 创建 WebhookEvent
    WT->>WP: 触发管道
    WP->>UW: 调用 Webhook 函数
    UW->>API: 调用外部 API
    API-->>UW: 返回响应
    UW-->>WP: 处理完成
    WP-->>HS: 返回结果
    HS-->>WC: HTTP 200 响应
```

### 3. 定时任务流

```mermaid
sequenceDiagram
    participant CT as Cron 触发器
    participant JP as 任务管道
    participant UJ as 用户任务
    participant API as Onebot API

    CT->>CT: 检查 cron 表达式
    CT->>JP: 创建 CronEvent
    JP->>UJ: 调用任务函数
    UJ->>API: 调用 Onebot API
    API-->>UJ: 返回响应
    UJ-->>JP: 任务执行完成
    JP-->>CT: 管道执行完成
```

## 数据结构转换

### Onebot 事件转换
```typescript
// 原始 WebSocket 消息
{
  "post_type": "message",
  "message_type": "private",
  "user_id": 123456,
  "message": "Hello"
}

// 转换为 OnebotEvent
interface OnebotEvent {
  post_type: string
  message_type: string
  user_id: number
  message: string
  // ... 其他字段
}
```

### Webhook 事件转换
```typescript
// HTTP 请求
POST /webhook/my-webhook?param=value
Authorization: Bearer token123
Content-Type: application/json

{"data": "example"}

// 转换为 WebhookEvent
interface WebhookEvent {
  webhookId: string        // "my-webhook"
  query: URLSearchParams   // {param: "value"}
  body: ArrayBuffer        // {"data": "example"}
}
```

### Cron 事件转换
```typescript
// 定时触发
cron: "0 9 * * *"  // 每天 9 点

// 转换为 CronEvent
interface CronEvent {
  timestamp: number  // 当前时间戳
  spec: string       // "0 9 * * *"
}
```

## 错误处理流

```mermaid
flowchart TD
    Error[错误发生] --> ErrorType{错误类型}
    
    ErrorType -->|Onebot API 错误| OnebotError[Onebot API 错误]
    ErrorType -->|Webhook 处理错误| WebhookError[Webhook 处理错误]
    ErrorType -->|中间件错误| MiddlewareError[中间件错误]
    ErrorType -->|任务错误| JobError[任务错误]
    
    OnebotError --> LogError[记录错误日志]
    WebhookError --> LogError
    MiddlewareError --> LogError
    JobError --> LogError
    
    LogError --> ErrorResponse[返回错误响应]
    ErrorResponse --> ExternalSystem[外部系统]
    
    classDef error fill:#ffebee
    classDef process fill:#fff3e0
    classDef response fill:#e8f5e8
    
    class Error,OnebotError,WebhookError,MiddlewareError,JobError error
    class ErrorType,LogError process
    class ErrorResponse,ExternalSystem response
```

## 性能优化点

1. **异步处理**: 所有 I/O 操作都是异步的，避免阻塞
2. **管道链式**: 中间件支持链式处理，提高复用性
3. **事件驱动**: 基于事件触发，避免轮询
4. **连接复用**: WebSocket 连接复用，减少连接开销
5. **错误隔离**: 各管道独立处理错误，互不影响
