import { useCallback, useEffect, useState } from 'react'
import { api, getKey, setKey, Unauthorized, type Lead, type Tag } from './api'
import AddLead from './AddLead'
import LeadCard from './LeadCard'
import Login from './Login'
import { btnPrimary, TagChip } from './ui'

export default function App() {
  const [authed, setAuthed] = useState(() => !!getKey())
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [tag, setTag] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const logout = useCallback(() => {
    setKey('')
    setAuthed(false)
  }, [])

  const load = useCallback(async () => {
    const qs = new URLSearchParams()
    if (tag) qs.set('tag', tag)
    try {
      const [l, t] = await Promise.all([api<Lead[]>(`/api/leads?${qs}`), api<Tag[]>('/api/tags')])
      setLeads(l)
      setTags(t)
      setError('')
    } catch (e) {
      if (e instanceof Unauthorized) return logout()
      setError(`Не удалось загрузить лидов: ${(e as Error).message}`)
    }
  }, [tag, logout])

  useEffect(() => {
    if (authed) load()
  }, [authed, load])

  if (!authed) return <Login onOk={() => setAuthed(true)} />

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Мини-CRM</h1>
        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
          Выйти
        </button>
      </header>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <TagChip key={t.id} tag={t} active={tag === t.id} suffix={String(t.count ?? 0)} onClick={() => setTag(tag === t.id ? '' : t.id)} />
        ))}
      </div>

      {adding ? (
        <AddLead
          onCancel={() => setAdding(false)}
          onDone={() => {
            setAdding(false)
            load()
          }}
        />
      ) : (
        <button className={`${btnPrimary} mt-4`} onClick={() => setAdding(true)}>
          Добавить лида
        </button>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {leads === null ? (
        <p className="mt-6 text-slate-500">Загружаю…</p>
      ) : leads.length === 0 ? (
        <p className="mt-6 text-slate-500">
          {tag ? 'С этим тегом лидов нет.' : 'Лидов пока нет. Напишите боту или добавьте лида вручную.'}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {leads.map((l) => (
            <LeadCard key={l.id} lead={l} allTags={tags} onChanged={load} />
          ))}
        </ul>
      )}
    </main>
  )
}
