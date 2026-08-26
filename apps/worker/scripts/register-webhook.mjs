/**
 * Registers (or updates) the Telegram webhook so bot updates — including the
 * /start "login" flow — are delivered to the Worker.
 *
 * Usage:
 *   TELEGRAM_BOT_TOKEN=<token> TELEGRAM_WEBHOOK_SECRET=<secret> \
 *     node scripts/register-webhook.mjs https://your-worker.example.com
 *
 * The URL must be the public route that ends in /api/bot (the webhook route).
 */
const webhookUrl = process.argv[2]
const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET

if (!webhookUrl || !token || !secret) {
  console.error(
    'Usage: TELEGRAM_BOT_TOKEN=<token> TELEGRAM_WEBHOOK_SECRET=<secret> node scripts/register-webhook.mjs <webhook_url>'
  )
  process.exit(1)
}

// Ask Telegram which info we want back in the update (from, so login works).
const params = new URLSearchParams({
  url: webhookUrl,
  secret_token: secret,
  allowed_updates: JSON.stringify(['message']),
  drop_pending_updates: 'true',
})

const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  body: params,
})
const data = await res.json()
console.log('setWebhook →', data)

// Verify: prints the webhook URL currently set.
const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`)
console.log('getWebhookInfo →', await infoRes.json())