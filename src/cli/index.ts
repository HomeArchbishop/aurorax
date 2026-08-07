#!/usr/bin/env node
import { Command } from 'commander'
import { initCommand } from './commands/init'
import { startCommand } from './commands/start'
import { devCommand } from './commands/dev'
import { napcatCommand } from './commands/napcat'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const program = new Command()
program
  .name('aurorax')
  .description('Aurorax CLI - OneBot 11 bot framework command line tools')
  .version(require('../../package.json').version)

program.addCommand(initCommand())
program.addCommand(startCommand())
program.addCommand(devCommand())
program.addCommand(napcatCommand())

process.on('unhandledRejection', (err) => {
  if (err instanceof Error && err.name === 'ExitPromptError') {
    process.exit(0)
  }
  throw err
})

program.parse()
