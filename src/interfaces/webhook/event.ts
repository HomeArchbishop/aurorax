export interface WebhookEvent {
  webhookId: string
  query: URLSearchParams
  body: ArrayBuffer
}
