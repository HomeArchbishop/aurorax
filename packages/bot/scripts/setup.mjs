import { spawnSync } from 'child_process'
import { existsSync, copyFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

const run = (cmd, args, opts = {}) => {
  console.log(`> ${cmd} ${args.join(' ')}`)
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: root, ...opts })
  if (r.status !== 0) throw new Error(`${cmd} exited with code ${r.status}`)
}

const has = (cmd) => spawnSync(cmd, ['--version'], { stdio: 'ignore' }).status === 0

const dockerDaemonUp = () => spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0

if (!has('bun')) {
  console.error('bun not found, install: https://bun.sh/')
  process.exit(1)
}
if (!has('docker')) {
  console.error('docker not found, install: https://docs.docker.com/get-docker/')
  process.exit(1)
}
if (!dockerDaemonUp()) {
  console.error('docker daemon is not running. start Docker Desktop (or the docker service) and retry.')
  process.exit(1)
}

if (!existsSync(path.join(root, '.env'))) {
  copyFileSync(path.join(root, '.env.example'), path.join(root, '.env'))
  console.log('.env created from .env.example')
}

run('docker', ['compose', 'pull'])
run('bun', ['install', '--registry', 'https://registry.npmmirror.com/'])

console.log('')
console.log('setup done. next steps:')
console.log('  1. bun start')
console.log('  2. bun run napcat:logs')
