import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from '../../_lib/db.js'
import { body, checkKey, fail, STATUSES } from '../../_lib/http.js'
import { getLead, logEvent } from '../../_lib/leads.js'
import { isUuid, str } from '../../_lib/validate.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkKey(req, res)) return
  const id = req.query.id
  if (!isUuid(id)) return res.status(400).json({ error: 'Неверный id лида' })
  try {
    if (req.method === 'PATCH') return await patch(id, req, res)
    if (req.method === 'DELETE') return await remove(id, res)
    res.status(405).json({ error: 'Метод не поддерживается' })
  } catch (e) {
    fail(res, e, 'lead')
  }
}

async function patch(id: string, req: VercelRequest, res: VercelResponse) {
  const b = body(req)
  const upd: Record<string, unknown> = {}
  if (b.status !== undefined) {
    if (!(STATUSES as readonly unknown[]).includes(b.status)) return res.status(400).json({ error: 'Неизвестный статус' })
    upd.status = b.status
  }
  for (const f of ['name', 'contact'] as const) {
    if (b[f] !== undefined) {
      const v = str(b[f], 200)
      if (!v) return res.status(400).json({ error: 'Имя и контакт не могут быть пустыми' })
      upd[f] = v
    }
  }
  if (b.request !== undefined) upd.request = str(b.request) || null
  if (!Object.keys(upd).length) return res.status(400).json({ error: 'Нечего менять' })

  const before = await getLead(id)
  if (!before) return res.status(404).json({ error: 'Лид не найден' })

  upd.updated_at = new Date().toISOString()
  const { error } = await db().from('leads').update(upd).eq('id', id)
  if (error) throw error

  if (upd.status && upd.status !== before.status) {
    await logEvent(id, 'status_changed', { from: before.status, to: upd.status })
  }
  const edited = (['name', 'contact', 'request'] as const).filter((f) => f in upd)
  if (edited.length) await logEvent(id, 'lead_edited', { fields: edited })

  res.status(200).json(await getLead(id))
}

async function remove(id: string, res: VercelResponse) {
  const { data, error } = await db().from('leads').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data.length) return res.status(404).json({ error: 'Лид не найден' })
  res.status(200).json({ ok: true })
}
