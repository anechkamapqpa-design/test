import { timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export const STATUSES = ['new', 'in_progress', 'done', 'rejected'] as const

// Сверяем x-app-key с APP_ACCESS_KEY. Без него отвечаем 401 и возвращаем false.
export function checkKey(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.APP_ACCESS_KEY ?? ''
  const got = String(req.headers['x-app-key'] ?? '')
  const ok =
    expected.length > 0 &&
    got.length === expected.length &&
    timingSafeEqual(Buffer.from(got), Buffer.from(expected))
  if (!ok) res.status(401).json({ error: 'Неверный код доступа' })
  return ok
}

export function fail(res: VercelResponse, e: unknown, where: string) {
  console.error(where, e)
  res.status(500).json({ error: (e as { message?: string })?.message ?? 'Внутренняя ошибка' })
}

export function body(req: VercelRequest): Record<string, unknown> {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  return (req.body ?? {}) as Record<string, unknown>
}
