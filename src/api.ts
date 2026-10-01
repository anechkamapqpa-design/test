export type Tag = { id: string; name: string; color: string; count?: number }
export type Status = 'new' | 'in_progress' | 'done' | 'rejected'
export type Lead = {
  id: string
  name: string
  contact: string
  request: string | null
  source: 'bot' | 'manual' | 'telegram_personal'
  status: Status
  tg_username: string | null
  created_at: string
  tags: Tag[]
}

const KEY = 'crm-access-key'
export const getKey = () => {
  try { return localStorage.getItem(KEY) ?? '' } catch { return '' }
}
export const setKey = (k: string) => {
  try { k ? localStorage.setItem(KEY, k) : localStorage.removeItem(KEY) } catch { /* приватный режим */ }
}

export class Unauthorized extends Error {}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(path, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-app-key': getKey(), ...(init.headers ?? {}) },
  })
  const data = await r.json().catch(() => ({}))
  if (r.status === 401) throw new Unauthorized(data.error ?? 'Неверный код доступа')
  if (!r.ok) throw new Error(data.error ?? `Ошибка ${r.status}`)
  return data as T
}
