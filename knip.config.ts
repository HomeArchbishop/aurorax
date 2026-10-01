import type { KnipConfig } from 'knip'

export default {
  entry: [
    'docs/.vitepress/config.ts',
    'docs/.vitepress/theme/index.ts',
  ],
  ignore: [
    'dist/**/*',
  ],
} satisfies KnipConfig
