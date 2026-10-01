import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendMessage } from './_lib/tg.js'

// Этап 3: эхо. Проверяем секрет и отвечаем тем же текстом.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers['x-telegram-bot-api-secret-token'] !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    res.status(401).json({ error: 'bad secret' })
    return
  }
  try {
    const msg = req.body?.message
    if (msg?.chat?.id) await sendMessage(msg.chat.id, msg.text ?? 'Пришлите, пожалуйста, текстом')
  } catch (e) {
    console.error('telegram webhook', e)
  }
  // Всегда 200, иначе телеграм будет повторять обновление.
  res.status(200).json({ ok: true })
}
