import { useCallback, useEffect, useState } from 'react'
import { api, getKey, setKey, Unauthorized, type Lead, type Status, type Tag } from './api'
import AddLead from './AddLead'
import LeadCard, { STATUS } from './LeadCard'
import Login from './Login'
import { btn, btnPrimary, input, TagChip } from './ui'

const REFRESH_MS = 15_000

function isToday(iso: string) {
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

export default function App() {
  const [authed, setAuthed] = useState(() => !!getKey())
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [all, setAll] = useState<Lead[]>([]) // без фильтров, для счётчиков
  const [tags, setTags] = useState<Tag[]>([])
  const [tag, setTag] = useState('')
  const [status, setStatus] = useState<Status | ''>('')
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const filtered = !!(tag || status || q)

  const logout = useCallback(() => {
    setKey('')
    setAuthed(false)
  }, [])

  // Поиск уходит на сервер через 300 мс после последнего нажатия.
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput.trim()), 300)
    return () => clearTimeout(t)
  }, [qInput])

  const load = useCallback(async () => {
    const qs = new URLSearchParams()
    if (tag) qs.set('tag', tag)
    if (status) qs.set('status', status)
    if (q) qs.set('q', q)
    try {
      const [l, t, a] = await Promise.all([
        api<Lead[]>(`/api/leads?${qs}`),
        api<Tag[]>('/api/tags'),
        filtered ? api<Lead[]>('/api/leads') : null,
      ])
      setLeads(l)
      setTags(t)
      setAll(a ?? l)
      setError('')
    } catch (e) {
      if (e instanceof Unauthorized) return logout()
      setError(`Не удалось загрузить лидов: ${(e as Error).message}`)
    }
  }, [tag, status, q, filtered, logout])

  useEffect(() => {
    if (!authed) return
    load()
    // Автообновление: лид из бота появляется без перезагрузки страницы.
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, REFRESH_MS)
    return () => clearInterval(id)
  }, [authed, load])

  function reset() {
    setTag('')
    setStatus('')
    setQInput('')
    setQ('')
  }

  if (!authed) return <Login onOk={() => setAuthed(true)} />

  const counters = [
    ['всего', all.length],
    ['новых', all.filter((l) => l.status === 'new').length],
    ['за сегодня', all.filter((l) => isToday(l.created_at)).length],
  ] as const

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Мини-CRM</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-slate-600">
            {counters.map(([label, n]) => (
              <span key={label}>
                <b className="text-slate-900">{n}</b> {label}
              </span>
            ))}
          </div>
        </div>
        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
          Выйти
        </button>
      </header>

      <section className="mt-5 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={input}
            type="search"
            placeholder="Поиск по имени, контакту, запросу"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status | '')}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm sm:flex-none"
            >
              <option value="">Все статусы</option>
              {Object.entries(STATUS).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
            <button className={btn} onClick={reset} disabled={!filtered && !qInput}>
              Сбросить
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <TagChip
              key={t.id}
              tag={t}
              active={tag === t.id}
              suffix={String(t.count ?? 0)}
              onClick={() => setTag(tag === t.id ? '' : t.id)}
            />
          ))}
        </div>
      </section>

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
          {filtered
            ? 'По этому фильтру никого не нашлось. Попробуйте «Сбросить».'
            : 'Лидов пока нет. Напишите боту или добавьте лида вручную.'}
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
