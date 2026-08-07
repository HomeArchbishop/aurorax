import { Command } from 'commander'
import { spawnSync } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import { logger } from '@/internal/logger'
import {
  detectPlatform,
  hasDocker,
  writeOnebotConfig,
  writeDockerCompose,
  fetchLatestReleaseAsset,
  downloadFile,
  DEFAULT_ONEBOT_PORT,
} from '../napcat'

const NAPCAT_INSTALLER_URL = 'https://nclatest.znin.net/NapNeko/NapCat-Installer/main/script/install.sh'

async function installDocker (): Promise<void> {
  await writeOnebotConfig('.', { port: DEFAULT_ONEBOT_PORT, token: '' })
  await writeDockerCompose('.', DEFAULT_ONEBOT_PORT)
  const r = spawnSync('docker', ['compose', 'pull'], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error('docker compose pull failed')
  logger.info('napcat (docker) ready. start with: aurorax napcat start')
}

async function installLinuxNative (): Promise<void> {
  const r = spawnSync('bash', ['-c', `curl -o napcat.sh ${NAPCAT_INSTALLER_URL} && bash napcat.sh --docker n --cli n`], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error('napcat installer failed')
}

async function installWindowsNative (): Promise<void> {
  const url = await fetchLatestReleaseAsset('NapCat.Shell.Windows.OneKey.zip')
  const dest = path.resolve('napcat-onekey.zip')
  logger.info(`downloading ${url}`)
  await downloadFile(url, dest)
  const r = spawnSync('tar', ['-xf', dest, '-C', '.'], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error('extract failed')
  await fs.rm(dest, { force: true })
  logger.info('napcat extracted. run napcat.bat to start')
}

async function install (options: { native?: boolean }): Promise<void> {
  const platform = detectPlatform()
  if (options.native) {
    if (platform === 'linux') return await installLinuxNative()
    if (platform === 'win32') return await installWindowsNative()
    logger.warn(`native install not supported on ${platform}, falling back to docker`)
  }
  if (!hasDocker()) {
    throw new Error('docker not found. install: https://docs.docker.com/get-docker/')
  }
  await installDocker()
}

export function napcatCommand (): Command {
  const cmd = new Command('napcat').description('Manage NapCat integration')

  cmd.addCommand(
    new Command('install')
      .description('Install NapCat (docker by default, --native for host install)')
      .option('--native', 'install natively instead of docker')
      .action(install),
  )

  cmd.addCommand(
    new Command('config')
      .description('Write napcat/config/onebot11.json (WS server preset)')
      .option('-p, --port <port>', 'ws server port', String(DEFAULT_ONEBOT_PORT))
      .option('-t, --token <token>', 'access token', '')
      .action(async (options: { port: string, token: string }) => {
        const file = await writeOnebotConfig('.', { port: Number(options.port), token: options.token })
        logger.info(`onebot config written: ${file}`)
      }),
  )

  cmd.addCommand(
    new Command('start')
      .description('Start NapCat service')
      .action(() => {
        const platform = detectPlatform()
        if (platform === 'win32' && !hasDocker()) {
          spawnSync('cmd', ['/c', 'napcat.bat'], { stdio: 'inherit' })
          return
        }
        const r = spawnSync('docker', ['compose', 'up', '-d'], { stdio: 'inherit' })
        if (r.status !== 0) throw new Error('docker compose up failed')
        logger.info(`napcat started. ws server on :${DEFAULT_ONEBOT_PORT}, webui on :6099`)
      }),
  )

  return cmd
}
