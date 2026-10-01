// Ставит вебхук бота на /api/telegram и показывает getWebhookInfo.
// Токен и секрет читаются из .env.local, в консоль не печатаются.
// Запуск: node scripts/set-webhook.mjs https://<домен>.vercel.app
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const token = env.TELEGRAM_BOT_TOKEN
const secret = env.TELEGRAM_WEBHOOK_SECRET
const base = (process.argv[2] || '').replace(/\/$/, '')
if (!token || token.startsWith('ВСТАВЬТЕ')) throw new Error('В .env.local не заполнен TELEGRAM_BOT_TOKEN')
if (!secret) throw new Error('В .env.local нет TELEGRAM_WEBHOOK_SECRET')
if (!base.startsWith('https://')) throw new Error('Передайте домен: node scripts/set-webhook.mjs https://<домен>.vercel.app')

const api = (m, body) =>
  fetch(`https://api.telegram.org/bot${token}/${m}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json())

console.log('setWebhook:', await api('setWebhook', { url: `${base}/api/telegram`, secret_token: secret }))
const info = await api('getWebhookInfo')
console.log('getWebhookInfo:', { url: info.result?.url, pending: info.result?.pending_update_count, last_error_message: info.result?.last_error_message ?? '—' })
