import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from './_lib/db.js'
import { body, checkKey, fail } from './_lib/http.js'
import { COLORS, str } from './_lib/validate.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!checkKey(req, res)) return
  try {
    if (req.method === 'GET') {
      const { data, error } = await db().from('tags').select('id, name, color, lead_tags(count)').order('name')
      if (error) throw error
      return res.status(200).json(
        data.map(({ lead_tags, ...t }) => ({ ...t, count: (lead_tags as { count: number }[])[0]?.count ?? 0 })),
      )
    }
    if (req.method === 'POST') {
      const b = body(req)
      const name = str(b.name, 40)?.toLowerCase()
      if (!name) return res.status(400).json({ error: 'Название тега обязательно' })
      const color = (COLORS as readonly unknown[]).includes(b.color) ? (b.color as string) : 'slate'
      const { data, error } = await db().from('tags').insert({ name, color }).select('id, name, color').single()
      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Такой тег уже есть' })
        throw error
      }
      return res.status(201).json({ ...data, count: 0 })
    }
    res.status(405).json({ error: 'Метод не поддерживается' })
  } catch (e) {
    fail(res, e, 'tags')
  }
}
