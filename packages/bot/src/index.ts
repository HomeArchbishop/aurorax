import { App } from 'aurorax'

const app = new App({
  onebot: {
    type: 'ws-reverse',
    url: process.env.AURORAX_WS_URL ?? 'ws://localhost:3001',
    token: process.env.AURORAX_WS_TOKEN,
  },
})

app.useMw(async (ctx, next) => {
  const { event } = ctx
  if (event.post_type !== 'message') {
    await next()
    return
  }
  console.log(`[message] ${event.message_type} ${event.user_id}: ${event.raw_message}`)
  if (event.raw_message === 'ping') {
    if (event.message_type === 'private') {
      ctx.send({ action: 'send_private_msg', params: { user_id: event.user_id, message: 'pong' } })
    } else {
      ctx.send({ action: 'send_group_msg', params: { group_id: event.group_id, message: 'pong' } })
    }
  }
  await next()
})

await app.start()
