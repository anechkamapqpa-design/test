import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../_lib/db.js'
import { checkKey, fail, STATUSES } from '../_lib/http.js'
import { LEAD_SELECT, shapeLead } from '../_lib/leads.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkKey(req, res)) return
  try {
    if (req.method === 'GET') return await list(req, res)
    res.status(405).json({ error: 'Метод не поддерживается' })
  } catch (e) {
    fail(res, e, 'leads')
  }
}

async function list(req: VercelRequest, res: VercelResponse) {
  const tag = typeof req.query.tag === 'string' ? req.query.tag : ''
  const status = typeof req.query.status === 'string' ? req.query.status : ''
  // Запятые и скобки ломают синтаксис .or() в PostgREST, % и _ это маски ilike.
  const q = (typeof req.query.q === 'string' ? req.query.q : '').replace(/[,()%_\*]/g, ' ').trim()

  let query = db().from('leads').select(LEAD_SELECT).order('created_at', { ascending: false }).limit(500)

  if (status) {
    if (!(STATUSES as readonly string[]).includes(status)) return res.status(400).json({ error: 'Неизвестный статус' })
    query = query.eq('status', status)
  }
  if (q) query = query.or(`name.ilike.%${q}%,contact.ilike.%${q}%,request.ilike.%${q}%`)
  if (tag) {
    if (!/^[0-9a-f-]{36}$/i.test(tag)) return res.status(400).json({ error: 'Неверный id тега' })
    const { data: links, error } = await db().from('lead_tags').select('lead_id').eq('tag_id', tag)
    if (error) throw error
    if (!links.length) return res.status(200).json([])
    query = query.in('id', links.map((l) => l.lead_id))
  }

  const { data, error } = await query
  if (error) throw error
  res.status(200).json(data.map((r) => shapeLead(r as never)))
}
