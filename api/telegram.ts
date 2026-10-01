import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleMessage, BOT_TEXT } from './_lib/bot.js'
import { sendMessage } from './_lib/tg.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers['x-telegram-bot-api-secret-token'] !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    res.status(401).json({ error: 'bad secret' })
    return
  }
  const msg = req.body?.message
  try {
    if (msg?.chat?.id) await handleMessage(msg)
  } catch (e) {
    console.error('telegram webhook', e)
    if (msg?.chat?.id) await sendMessage(msg.chat.id, BOT_TEXT.error).catch(() => {})
  }
  // Всегда 200, иначе телеграм будет повторять обновление.
  res.status(200).json({ ok: true })
}
