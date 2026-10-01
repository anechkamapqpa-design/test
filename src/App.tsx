import { useCallback, useEffect, useState } from 'react'
import { api, getKey, setKey, Unauthorized, type Lead } from './api'
import Login from './Login'

const SOURCE: Record<Lead['source'], string> = { bot: 'бот', manual: 'вручную', telegram_personal: 'личный телеграм' }

export default function App() {
  const [authed, setAuthed] = useState(() => !!getKey())
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [error, setError] = useState('')

  const logout = useCallback(() => {
    setKey('')
    setAuthed(false)
  }, [])

  const load = useCallback(async () => {
    try {
      setLeads(await api<Lead[]>('/api/leads'))
      setError('')
    } catch (e) {
      if (e instanceof Unauthorized) return logout()
      setError(`Не удалось загрузить лидов: ${(e as Error).message}`)
    }
  }, [logout])

  useEffect(() => {
    if (authed) load()
  }, [authed, load])

  if (!authed) return <Login onOk={() => setAuthed(true)} />

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Мини-CRM</h1>
        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">Выйти</button>
      </header>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {leads === null ? (
        <p className="mt-6 text-slate-500">Загружаю…</p>
      ) : leads.length === 0 ? (
        <p className="mt-6 text-slate-500">Лидов пока нет. Напишите боту или добавьте лида вручную.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {leads.map((l) => (
            <li key={l.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium text-slate-900">{l.name}</span>
                <span className="break-all text-slate-600">{l.contact}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{SOURCE[l.source]}</span>
                {l.tg_username && <span className="text-xs text-slate-500">@{l.tg_username}</span>}
              </div>
              {l.request && <p className="mt-2 whitespace-pre-wrap break-words text-slate-700">{l.request}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
