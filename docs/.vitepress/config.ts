import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: 'Aurorax',
    description: '基于 OneBot 11 协议的 Node.js Bot 开发框架',
    lang: 'zh-CN',
    themeConfig: {
      nav: [
        { text: '教程', link: '/tutorial/01-getting-started' },
        { text: 'API', link: '/api/' },
        { text: '开发文档', link: '/dev/architecture-overview' },
      ],
      sidebar: {
        '/': [
          {
            text: '使用教程',
            items: [
              { text: '快速开始', link: '/tutorial/01-getting-started' },
              { text: '中间件模式', link: '/tutorial/02-middleware' },
              { text: '事件处理', link: '/tutorial/03-event-handling' },
              { text: '定时任务', link: '/tutorial/04-cron-jobs' },
              { text: 'Webhook 集成', link: '/tutorial/05-webhooks' },
            ],
          },
          {
            text: 'API 参考',
            items: [
              { text: 'API 参考', link: '/api/' },
            ],
          },
          {
            text: '框架开发',
            items: [
              { text: '架构概览', link: '/dev/architecture-overview' },
              { text: '接口与组件', link: '/dev/interfaces-and-components' },
              { text: '数据流', link: '/dev/data-flow' },
              { text: '设计决策', link: '/dev/design-decisions' },
            ],
          },
        ],
      },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/homearchbishop/aurorax' },
      ],
    },
  }),
)
