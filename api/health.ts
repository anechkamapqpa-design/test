import type { VercelRequest, VercelResponse } from '@vercel/node'
import { db } from './_lib/db.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const { error } = await db().from('tags').select('id', { head: true, count: 'exact' })
    if (error) throw error
    res.status(200).json({ ok: true, db: true })
  } catch (e) {
    console.error('health', e)
    res.status(500).json({ ok: false, db: false, error: (e as { message?: string })?.message ?? String(e) })
  }
}
