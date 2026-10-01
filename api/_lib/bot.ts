import { db } from './db.js'
import { sendMessage } from './tg.js'

type Step = 'idle' | 'ask_name' | 'ask_contact' | 'ask_request'
type Draft = { name?: string; contact?: string; contactRetried?: boolean; raw?: string[] }

const MAX = 500
const T = {
  start: 'Привет! Оставьте заявку, это три вопроса. Как к вам обращаться?',
  askContact: 'Как с вами связаться? Телефон, почта или телеграм.',
  askRequest: 'Коротко опишите задачу.',
  done: 'Готово, заявка принята. Мы свяжемся с вами.',
  cancel: 'Отменила. Напишите /start, когда будете готовы',
  idle: 'Чтобы оставить заявку, напишите /start',
  notText: 'Пришлите, пожалуйста, текстом',
  badContact: 'Не разобрала контакт. Пришлите телефон, почту или @ник',
  error: 'Что-то пошло не так, заявка не сохранилась. Пришлите ответ ещё раз через минуту.',
}

const clip = (s: string) => (s.length > MAX ? s.slice(0, MAX - 1) + '…' : s)

// Мягкая проверка: ищем внутри текста хоть что-то похожее на контакт.
export function looksLikeContact(s: string): boolean {
  const digits = s.replace(/\D/g, '')
  return (
    /\S+@\S+\.\S+/.test(s) ||
    /(^|\s)@[A-Za-z0-9_]{4,32}\b/.test(s) ||
    (/^[\d\s+\-().]+$/.test(s.trim()) && digits.length >= 7) ||
    /\+?\d[\d\s\-()]{6,}\d/.test(s)
  )
}

async function loadSession(chatId: number): Promise<{ step: Step; draft: Draft }> {
  const { data, error } = await db().from('bot_sessions').select('step, draft').eq('chat_id', chatId).maybeSingle()
  if (error) throw error
  return data ? { step: data.step as Step, draft: (data.draft ?? {}) as Draft } : { step: 'idle', draft: {} }
}

async function saveSession(chatId: number, step: Step, draft: Draft) {
  const { error } = await db()
    .from('bot_sessions')
    .upsert({ chat_id: chatId, step, draft, updated_at: new Date().toISOString() })
  if (error) throw error
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleMessage(msg: any): Promise<void> {
  const chatId: number = msg.chat.id
  const text: string | undefined = typeof msg.text === 'string' ? msg.text.trim() : undefined

  if (!text) return sendMessage(chatId, T.notText)

  const cmd = text.split(/\s|@/)[0].toLowerCase()
  if (cmd === '/start') {
    await saveSession(chatId, 'ask_name', {})
    return sendMessage(chatId, T.start)
  }
  if (cmd === '/cancel') {
    await saveSession(chatId, 'idle', {})
    return sendMessage(chatId, T.cancel)
  }

  const { step, draft } = await loadSession(chatId)
  const raw = [...(draft.raw ?? []), text]

  switch (step) {
    case 'ask_name':
      await saveSession(chatId, 'ask_contact', { ...draft, name: clip(text), raw })
      return sendMessage(chatId, T.askContact)

    case 'ask_contact':
      if (!looksLikeContact(text) && !draft.contactRetried) {
        await saveSession(chatId, 'ask_contact', { ...draft, contactRetried: true, raw })
        return sendMessage(chatId, T.badContact)
      }
      await saveSession(chatId, 'ask_request', { ...draft, contact: clip(text), raw })
      return sendMessage(chatId, T.askRequest)

    case 'ask_request': {
      const { data: lead, error } = await db()
        .from('leads')
        .insert({
          name: draft.name ?? 'Без имени',
          contact: draft.contact ?? '',
          request: clip(text),
          source: 'bot',
          tg_chat_id: chatId,
          tg_username: msg.from?.username ?? null,
        })
        .select('id')
        .single()
      if (error || !lead) {
        console.error('lead insert', error)
        return sendMessage(chatId, T.error) // шаг не сбрасываем: повторный ответ создаст лида
      }
      const { error: evError } = await db().from('events').insert({
        lead_id: lead.id,
        kind: 'lead_created',
        payload: { source: 'bot', messages: raw, from: msg.from ?? null },
      })
      if (evError) console.error('event insert', evError)
      await saveSession(chatId, 'idle', {})
      return sendMessage(chatId, T.done)
    }

    default:
      return sendMessage(chatId, T.idle)
  }
}

export const BOT_TEXT = T
