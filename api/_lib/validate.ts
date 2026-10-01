export const COLORS = ['slate', 'red', 'amber', 'emerald', 'sky', 'violet', 'pink'] as const
export const isUuid = (s: unknown): s is string => typeof s === 'string' && /^[0-9a-f-]{36}$/i.test(s)

// Строка из тела запроса: без пробелов по краям и не длиннее max.
export function str(v: unknown, max = 500): string | undefined {
  if (v === undefined || v === null) return undefined
  return String(v).trim().slice(0, max)
}
