import { spawn, spawnSync } from 'child_process'
import net from 'net'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const WS_PORT = Number(process.env.NAPCAT_WS_PORT ?? 3001)
const WS_HOST = process.env.NAPCAT_WS_HOST ?? '127.0.0.1'
const TIMEOUT_MS = 60_000

const waitPort = (port, host, timeoutMs) => new Promise((resolve, reject) => {
  const deadline = Date.now() + timeoutMs
  const tryConnect = () => {
    const socket = net.connect(port, host)
    socket.once('connect', () => { socket.end(); resolve() })
    socket.once('error', () => {
      socket.destroy()
      if (Date.now() > deadline) reject(new Error(`timeout waiting for ${host}:${port}`))
      else setTimeout(tryConnect, 1000)
    })
  }
  tryConnect()
})

const dockerDaemonUp = () => spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0
if (!dockerDaemonUp()) {
  console.error('docker daemon is not running. start Docker Desktop (or the docker service) and retry.')
  process.exit(1)
}

console.log('> docker compose up -d')
const up = spawnSync('docker', ['compose', 'up', '-d'], { stdio: 'inherit', cwd: root })
if (up.status !== 0) process.exit(up.status ?? 1)

console.log(`waiting for napcat ws server ${WS_HOST}:${WS_PORT} ...`)
await waitPort(WS_PORT, WS_HOST, TIMEOUT_MS)
console.log('napcat ws ready')

console.log('> starting bot (watch mode)')
const bot = spawn('bun', ['--watch', 'src/index.ts'], {
  stdio: 'inherit',
  cwd: path.join(root, 'packages', 'bot'),
})
bot.on('exit', code => process.exit(code ?? 0))
