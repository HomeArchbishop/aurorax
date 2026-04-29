---
layout: home

hero:
  name: Aurorax
  text: 中间件模式的 OneBot 11 编程框架
  image:
    src: /aurorax-musume.png
    alt: Aurorax
  actions:
    - theme: brand
      text: 快速开始
      link: /tutorial/01-getting-started
    - theme: alt
      text: API 参考
      link: /api/
    - theme: alt
      text: GitHub
      link: https://github.com/homearchbishop/aurorax

features:
  - title: 中间件管道
    details: 类 Koa 的 async/await 中间件链，支持 next() 控制流
  - title: 定时任务
    details: 基于 cron 表达式的任务调度，轻松实现定时推送
  - title: Webhook 集成
    details: 内置 HTTP 服务器，接入 GitHub、GitLab 等外部服务
  - title: 完整类型支持
    details: TypeScript 类型定义覆盖所有 OneBot 11 API，IDE 友好
---
