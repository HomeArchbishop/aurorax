import { defineConfig, globalIgnores } from 'eslint/config'
import neostandard from 'neostandard'

export default defineConfig([
  ...neostandard({
    ts: true,
  }),
  globalIgnores(['dist/**/*', 'packages/**/*']),
  {
    rules: {
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
    },
  },
])
