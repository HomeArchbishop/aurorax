import type { KnipConfig } from 'knip'

export default {
  ignore: ['dist/**/*', 'docs/.vitepress/**/*'],
  ignoreDependencies: ['mermaid', 'vitepress-plugin-mermaid'],
} satisfies KnipConfig
