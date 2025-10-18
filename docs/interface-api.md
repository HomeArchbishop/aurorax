# 接口与 API 图

## 核心接口关系图

```mermaid
graph TB
    subgraph "用户接口层"
        IApp[IApp 接口]
        Middleware[Middleware 类型]
        Job[Job 类型]
        Webhook[Webhook 类型]
    end

    subgraph "上下文接口"
        Context[Context 接口]
        CtxSend[CtxSend 类型]
    end

    subgraph "事件接口"
        OnebotEvent[OnebotEvent 接口]
        CronEvent[CronEvent 接口]
        WebhookEvent[WebhookEvent 接口]
    end

    subgraph "Onebot 接口"
        OnebotAPI[Onebot API 接口]
        ApiRequest[ApiRequest 类型]
        ApiResponse[ApiResponse 类型]
        OnebotBridge[OnebotBridge 接口]
    end

    subgraph "管道接口"
        Pipeline[Pipeline 接口]
        Pipeable[Pipeable 接口]
    end

    subgraph "触发器接口"
        Trigger[触发器基类]
        OnebotTrigger[OnebotTrigger]
        WebhookTrigger[WebhookTrigger]
        CronTrigger[CronTrigger]
    end

    %% 关系连接
    IApp --> Middleware
    IApp --> Job
    IApp --> Webhook

    Middleware --> Context
    Job --> Context
    Webhook --> Context

    Context --> CtxSend
    Context --> OnebotEvent
    Context --> CronEvent
    Context --> WebhookEvent

    CtxSend --> ApiRequest
    CtxSend --> OnebotAPI

    OnebotAPI --> ApiResponse
    OnebotBridge --> OnebotAPI

    Pipeline --> OnebotEvent
    Pipeline --> CronEvent
    Pipeline --> WebhookEvent

    OnebotTrigger --> Pipeline
    WebhookTrigger --> Pipeline
    CronTrigger --> Pipeline

    %% 样式
    classDef user fill:#e8f5e8
    classDef context fill:#fff3e0
    classDef event fill:#e3f2fd
    classDef onebot fill:#fce4ec
    classDef pipeline fill:#f3e5f5
    classDef trigger fill:#fff8e1

    class IApp,Middleware,Job,Webhook user
    class Context,CtxSend context
    class OnebotEvent,CronEvent,WebhookEvent event
    class OnebotAPI,ApiRequest,ApiResponse,OnebotBridge onebot
    class Pipeline,Pipeable pipeline
    class Trigger,OnebotTrigger,WebhookTrigger,CronTrigger trigger
```

## 详细接口定义

### 1. 应用接口 (IApp)

```mermaid
classDiagram
    class IApp {
        <<interface>>
        +useMw(mw: Middleware) IApp
        +useJob(spec: string, job: Job) IApp
        +useWebhook(webhookId: string, webhook: Webhook) IApp
        +start() Promise~void~
    }

    class App {
        -onebotBridge: OnebotBridge
        -webhookServer: WebhookServer
        -onebotTrigger: OnebotTrigger
        -cronTrigger: CronTrigger
        -webhookTrigger: WebhookTrigger
        -middlewarePipelines: MiddlewarePipeline[]
        -jobPipelines: JobPipeline[]
        -webhookPipelines: WebhookPipeline[]
        +useMw(mw: Middleware) IApp
        +useJob(spec: string, job: Job) IApp
        +useWebhook(webhookId: string, webhook: Webhook) IApp
        +start() Promise~void~
    }

    IApp <|.. App : implements
```

### 2. 上下文接口 (Context)

```mermaid
classDiagram
    class Context {
        <<interface>>
        +send: CtxSend
        +event: E
    }

    class CtxSend {
        <<type>>
        +call(req: ApiRequest, onSuccess?, onFailure?) void
    }

    class OnebotEvent {
        +post_type: string
        +message_type: string
        +user_id: number
        +message: string
        +time: number
    }

    class CronEvent {
        +timestamp: number
        +spec: string
    }

    class WebhookEvent {
        +webhookId: string
        +query: URLSearchParams
        +body: ArrayBuffer
    }

    Context --> CtxSend : contains
    Context --> OnebotEvent : contains
    Context --> CronEvent : contains
    Context --> WebhookEvent : contains
```

### 3. Onebot API 接口

```mermaid
classDiagram
    class OnebotAPI {
        <<interface>>
        +send_private_msg(user_id: number, message: string) Promise
        +send_group_msg(group_id: number, message: string) Promise
        +get_login_info() Promise
        +get_stranger_info(user_id: number) Promise
        +get_group_info(group_id: number) Promise
    }

    class ApiRequest {
        <<type>>
        +action: string
        +params: object
        +echo: string
    }

    class ApiResponse {
        <<type>>
        +status: string
        +data: any
        +echo: string
    }

    class OnebotBridge {
        <<interface>>
        +addOnebotEventListener(listener) void
        +send: CtxSend
        +establishConnectionToOnebot() Promise~void~
    }

    OnebotAPI --> ApiRequest : uses
    OnebotAPI --> ApiResponse : returns
    OnebotBridge --> OnebotAPI : implements
```

### 4. 管道接口

```mermaid
classDiagram
    class Pipeline {
        <<interface>>
        +execute(event: E) Promise~void~
    }

    class Pipeable {
        <<interface>>
        +pipeTo(pipeline: Pipeline) void
    }

    class MiddlewarePipeline {
        -middleware: Middleware
        -onebotBridge: OnebotBridge
        -meta: PipelineMeta
        +execute(event: OnebotEvent) Promise~void~
        +pipeTo(pipeline: MiddlewarePipeline) void
    }

    class JobPipeline {
        -job: Job
        -onebotBridge: OnebotBridge
        -meta: PipelineMeta
        +execute(event: CronEvent) Promise~void~
    }

    class WebhookPipeline {
        -webhook: Webhook
        -onebotBridge: OnebotBridge
        -meta: PipelineMeta
        +execute(event: WebhookEvent) Promise~void~
    }

    Pipeline <|.. MiddlewarePipeline : implements
    Pipeline <|.. JobPipeline : implements
    Pipeline <|.. WebhookPipeline : implements
    Pipeable <|.. MiddlewarePipeline : implements
```

## API 调用流程图

### Onebot API 调用流程

```mermaid
sequenceDiagram
    participant User as 用户代码
    participant Ctx as Context
    participant Bridge as OnebotBridge
    participant WS as WebSocket
    participant OB as Onebot 机器人

    User->>Ctx: ctx.send(request)
    Ctx->>Bridge: send(request, onSuccess, onFailure)
    Bridge->>WS: 发送 WebSocket 消息
    WS->>OB: 转发 API 请求
    OB-->>WS: 返回 API 响应
    WS-->>Bridge: 转发响应
    Bridge->>Bridge: 解析响应
    alt 成功
        Bridge->>User: 调用 onSuccess 回调
    else 失败
        Bridge->>User: 调用 onFailure 回调
    end
```

### 中间件链式调用流程

```mermaid
sequenceDiagram
    participant Event as Onebot 事件
    participant MP1 as 中间件管道1
    participant MP2 as 中间件管道2
    participant MP3 as 中间件管道3
    participant User1 as 用户中间件1
    participant User2 as 用户中间件2
    participant User3 as 用户中间件3

    Event->>MP1: 触发事件
    MP1->>User1: 调用中间件1
    User1->>User1: 处理逻辑
    User1->>MP1: next()
    MP1->>MP2: 传递给下一个管道
    MP2->>User2: 调用中间件2
    User2->>User2: 处理逻辑
    User2->>MP2: next()
    MP2->>MP3: 传递给下一个管道
    MP3->>User3: 调用中间件3
    User3->>User3: 处理逻辑
    User3->>MP3: 完成处理
    MP3-->>MP2: 返回结果
    MP2-->>MP1: 返回结果
    MP1-->>Event: 链式处理完成
```

## 类型安全设计

### 泛型接口设计

```typescript
// 上下文接口使用泛型确保类型安全
interface Context<E extends OnebotEvent | CronEvent | WebhookEvent> {
  readonly send: CtxSend
  readonly event: E
}

// 管道接口使用泛型
interface Pipeline<E> {
  execute(event: E): Promise<void>
}

// 用户函数类型定义
type Middleware = (ctx: Readonly<Context<OnebotEvent>>, next: () => Promise<void>) => Promise<void>
type Job = (ctx: Readonly<Context<CronEvent>>) => Promise<void>
type Webhook = (ctx: Context<WebhookEvent>) => Promise<void>
```

### API 类型安全

```typescript
// Onebot API 请求类型安全
type CtxSend = <T extends ApiActionName>(
  req: Omit<ApiRequest<T>, 'echo'>,
  onSuccess?: OnebotApiResCallback<ApiResponseStatus.OK, T>,
  onFailure?: OnebotApiResCallback<ApiResponseStatus.FAILED, T>
) => void

// 回调函数类型安全
type OnebotApiResCallback<
  S extends ApiResponseStatus = ApiResponseStatus, 
  T extends ApiActionName = ApiActionName,
> = (res: Omit<ApiResponse<S, T>, 'echo'>) => void
```

## 扩展接口设计

### 新增触发器接口

```typescript
interface Trigger<E> {
  connect(pipeline: Pipeline<E>): void
  start(): void
  stop(): void
}
```

### 新增管道接口

```typescript
interface CustomPipeline<E> extends Pipeline<E> {
  // 自定义管道方法
  customMethod(): void
}
```

### 新增桥接器接口

```typescript
interface CustomBridge {
  addEventListener(listener: (event: CustomEvent) => void): void
  send(data: any): Promise<any>
  connect(): Promise<void>
}
```

## 接口设计原则

1. **单一职责**: 每个接口只负责一个特定功能
2. **开闭原则**: 对扩展开放，对修改关闭
3. **里氏替换**: 子类可以替换父类
4. **接口隔离**: 接口应该小而专一
5. **依赖倒置**: 依赖抽象而不是具体实现
6. **类型安全**: 充分利用 TypeScript 的类型系统
