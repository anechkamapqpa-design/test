import { db } from './db.js'

// Лид вместе с тегами, одним запросом к базе.
export const LEAD_SELECT =
  'id, name, contact, request, source, status, tg_chat_id, tg_username, created_at, updated_at, lead_tags(tags(id, name, color))'

type Row = Record<string, unknown> & { lead_tags?: { tags: unknown }[] }

export type LeadOut = Record<string, unknown> & { status?: string; tags: unknown[] }

export function shapeLead(row: Row): LeadOut {
  const { lead_tags, ...rest } = row
  return { ...rest, tags: (lead_tags ?? []).map((lt) => lt.tags).filter(Boolean) }
}

export async function getLead(id: string) {
  const { data, error } = await db().from('leads').select(LEAD_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? shapeLead(data as Row) : null
}

export async function logEvent(leadId: string, kind: string, payload: unknown) {
  const { error } = await db().from('events').insert({ lead_id: leadId, kind, payload })
  if (error) console.error('event', kind, error)
}
