import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../_lib/db.js'
import { body, checkKey, fail } from '../../_lib/http.js'
import { getLead, logEvent } from '../../_lib/leads.js'
import { isUuid } from '../../_lib/validate.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkKey(req, res)) return
  const id = req.query.id
  // tagId из тела, а для DELETE на всякий случай и из query.
  const tagId = body(req).tagId ?? req.query.tagId
  if (!isUuid(id) || !isUuid(tagId)) return res.status(400).json({ error: 'Нужны id лида и tagId' })
  try {
    if (req.method === 'POST') {
      const { error } = await db()
        .from('lead_tags')
        .upsert({ lead_id: id, tag_id: tagId }, { onConflict: 'lead_id,tag_id', ignoreDuplicates: true })
      if (error) {
        if (error.code === '23503') return res.status(404).json({ error: 'Лид или тег не найден' })
        throw error
      }
      await logEvent(id, 'tag_added', { tagId })
    } else if (req.method === 'DELETE') {
      const { error } = await db().from('lead_tags').delete().eq('lead_id', id).eq('tag_id', tagId)
      if (error) throw error
      await logEvent(id, 'tag_removed', { tagId })
    } else {
      return res.status(405).json({ error: 'Метод не поддерживается' })
    }
    const lead = await getLead(id)
    if (!lead) return res.status(404).json({ error: 'Лид не найден' })
    res.status(200).json(lead)
  } catch (e) {
    fail(res, e, 'lead tags')
  }
}
