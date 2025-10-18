# Aurorax 架构概览

## 系统架构图

```mermaid
graph TB
    subgraph "外部系统"
        Onebot[Onebot 机器人]
        WebhookClient[Webhook 客户端]
        CronScheduler[系统定时器]
    end

    subgraph "Aurorax 核心框架"
        App[App 应用实例]
        
        subgraph "触发器层 (Triggers)"
            OnebotTrigger[Onebot 触发器]
            WebhookTrigger[Webhook 触发器]
            CronTrigger[定时任务触发器]
        end
        
        subgraph "管道层 (Pipelines)"
            MiddlewarePipeline[中间件管道]
            JobPipeline[任务管道]
            WebhookPipeline[Webhook 管道]
        end
        
        subgraph "桥接层 (Bridges)"
            OnebotBridge[Onebot 桥接器]
            WebhookServer[Webhook 服务器]
        end
        
        subgraph "接口层 (Interfaces)"
            OnebotAPI[Onebot API]
            WebhookAPI[Webhook API]
            CronAPI[定时任务 API]
        end
    end

    subgraph "用户代码"
        Middleware[中间件函数]
        Job[定时任务函数]
        Webhook[Webhook 处理函数]
    end

    %% 外部连接
    Onebot -->|WebSocket 连接| OnebotBridge
    WebhookClient -->|HTTP POST| WebhookServer
    CronScheduler -->|定时触发| CronTrigger

    %% 内部连接
    OnebotTrigger --> MiddlewarePipeline
    WebhookTrigger --> WebhookPipeline
    CronTrigger --> JobPipeline

    OnebotBridge --> OnebotTrigger
    WebhookServer --> WebhookTrigger

    %% 用户代码连接
    MiddlewarePipeline --> Middleware
    JobPipeline --> Job
    WebhookPipeline --> Webhook

    %% API 连接
    OnebotBridge --> OnebotAPI
    WebhookServer --> WebhookAPI
    CronTrigger --> CronAPI

    %% 样式
    classDef external fill:#e1f5fe
    classDef core fill:#f3e5f5
    classDef trigger fill:#fff3e0
    classDef pipeline fill:#e8f5e8
    classDef bridge fill:#fce4ec
    classDef interface fill:#f1f8e9
    classDef user fill:#fff8e1

    class Onebot,WebhookClient,CronScheduler external
    class App core
    class OnebotTrigger,WebhookTrigger,CronTrigger trigger
    class MiddlewarePipeline,JobPipeline,WebhookPipeline pipeline
    class OnebotBridge,WebhookServer bridge
    class OnebotAPI,WebhookAPI,CronAPI interface
    class Middleware,Job,Webhook user
```

## 核心概念

### 1. 触发器 (Triggers)
- **OnebotTrigger**: 监听 Onebot 事件，触发中间件管道
- **WebhookTrigger**: 监听 HTTP Webhook 请求，触发 Webhook 管道
- **CronTrigger**: 基于 cron 表达式定时触发任务管道

### 2. 管道 (Pipelines)
- **MiddlewarePipeline**: 处理 Onebot 事件的中间件链
- **JobPipeline**: 执行定时任务
- **WebhookPipeline**: 处理 Webhook 请求

### 3. 桥接器 (Bridges)
- **OnebotBridge**: 与 Onebot 机器人的通信桥接
- **WebhookServer**: HTTP 服务器，接收 Webhook 请求

### 4. 接口 (Interfaces)
- 定义各种事件和 API 的数据结构
- 提供类型安全的接口定义

## 数据流向

1. **Onebot 事件流**: Onebot → OnebotBridge → OnebotTrigger → MiddlewarePipeline → 用户中间件
2. **Webhook 事件流**: Webhook客户端 → WebhookServer → WebhookTrigger → WebhookPipeline → 用户处理函数
3. **定时任务流**: 系统定时器 → CronTrigger → JobPipeline → 用户任务函数

## 设计特点

- **模块化设计**: 各组件职责清晰，松耦合
- **管道模式**: 支持中间件链式处理
- **事件驱动**: 基于事件触发的异步处理
- **类型安全**: 完整的 TypeScript 类型定义
- **可扩展性**: 易于添加新的触发器和管道类型
