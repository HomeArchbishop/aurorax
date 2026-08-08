import { spawnSync } from 'child_process'
import { promises as fs, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import path from 'path'

interface OnebotConfig {
  port: number
  token: string
}

export const DEFAULT_ONEBOT_PORT = 3001

export function detectPlatform (): NodeJS.Platform {
  return process.platform
}

export function hasDocker (): boolean {
  return spawnSync('docker', ['--version'], { stdio: 'ignore' }).status === 0
}

function onebotConfigTemplate (port: number = DEFAULT_ONEBOT_PORT, token: string = ''): string {
  return JSON.stringify({
    network: {
      httpServers: [],
      httpClients: [],
      websocketServers: [
        {
          name: 'aurorax',
          enable: true,
          host: '0.0.0.0',
          port,
          messagePostFormat: 'array',
          reportSelfMessage: false,
          token,
          enableForcePushEvent: true,
          debug: false,
          heartInterval: 30000,
        },
      ],
      websocketClients: [],
    },
    musicSignUrl: '',
    enableLocalFile2Url: false,
    parseMultMsg: false,
  }, null, 2)
}

function dockerComposeTemplate (port: number = DEFAULT_ONEBOT_PORT): string {
  return `services:
  napcat:
    image: mlikiowa/napcat-docker:latest
    container_name: aurora-napcat
    restart: always
    environment:
      - NAPCAT_UID=\${NAPCAT_UID:-0}
      - NAPCAT_GID=\${NAPCAT_GID:-0}
    ports:
      - "6099:6099"
      - "${port}:${port}"
    volumes:
      - ./napcat/config:/app/napcat/config
      - ./napcat/QQ:/app/.config/QQ
`
}

export async function writeOnebotConfig (dir: string, config: OnebotConfig): Promise<string> {
  const configDir = path.join(dir, 'napcat', 'config')
  await fs.mkdir(configDir, { recursive: true })
  const file = path.join(configDir, 'onebot11.json')
  await fs.writeFile(file, onebotConfigTemplate(config.port, config.token))
  return file
}

export async function writeDockerCompose (dir: string, port: number = DEFAULT_ONEBOT_PORT): Promise<string> {
  const file = path.join(dir, 'docker-compose.yml')
  await fs.writeFile(file, dockerComposeTemplate(port))
  return file
}

interface ReleaseAsset {
  name: string
  browser_download_url: string
}

export async function fetchLatestReleaseAsset (assetName: string): Promise<string> {
  const res = await fetch('https://api.github.com/repos/NapNeko/NapCatQQ/releases/latest', {
    headers: { 'User-Agent': 'aurorax-cli' },
  })
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  const data = await res.json() as { assets: ReleaseAsset[] }
  const asset = data.assets.find(a => a.name === assetName)
  if (!asset) throw new Error(`asset ${assetName} not found in latest release`)
  return asset.browser_download_url
}

export async function downloadFile (url: string, dest: string): Promise<void> {
  const res = await fetch(url, { headers: { 'User-Agent': 'aurorax-cli' } })
  if (!res.ok || !res.body) throw new Error(`download failed: ${res.status}`)
  await pipeline(Readable.fromWeb(res.body as import('stream/web').ReadableStream), createWriteStream(dest))
}
