declare module 'bun' {
  interface Env {
    // Onebot ws-reverse connection
    AURORAX_WS_URL: string
    AURORAX_WS_TOKEN: string
    AURORAX_WS_TIMEOUT: number
    // Webhook server
    AURORAX_WEBHOOK_PORT: number
    // Logger
    AURORAX_LOG_LEVEL: string
    AURORAX_LOG_DIR: string
  }
}
