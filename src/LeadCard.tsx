import { useState } from 'react'
import { api, type Lead, type Status, type Tag } from './api'
import { btn, input, TAG_COLORS, TagChip } from './ui'

const SOURCE: Record<Lead['source'], string> = { bot: 'бот', manual: 'вручную', telegram_personal: 'личный телеграм' }
export const STATUS: Record<Status, string> = { new: 'новый', in_progress: 'в работе', done: 'готово', rejected: 'отказ' }

export default function LeadCard({
  lead,
  allTags,
  onChanged,
}: {
  lead: Lead
  allTags: Tag[]
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [picker, setPicker] = useState(false)
  const [newTag, setNewTag] = useState('')

  // Любое изменение: блокируем карточку, показываем ошибку, потом перечитываем список с тем же фильтром.
  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await fn()
      onChanged()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const setStatus = (status: Status) =>
    run(() => api(`/api/leads/${lead.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }))
  const addTag = (tagId: string) =>
    run(async () => {
      await api(`/api/leads/${lead.id}/tags`, { method: 'POST', body: JSON.stringify({ tagId }) })
      setPicker(false)
    })
  const removeTag = (tagId: string) =>
    run(() => api(`/api/leads/${lead.id}/tags`, { method: 'DELETE', body: JSON.stringify({ tagId }) }))
  const createTag = () =>
    run(async () => {
      const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]
      const tag = await api<Tag>('/api/tags', { method: 'POST', body: JSON.stringify({ name: newTag, color }) })
      await api(`/api/leads/${lead.id}/tags`, { method: 'POST', body: JSON.stringify({ tagId: tag.id }) })
      setNewTag('')
      setPicker(false)
    })
  const remove = () => {
    if (confirm(`Удалить лида «${lead.name}»?`)) run(() => api(`/api/leads/${lead.id}`, { method: 'DELETE' }))
  }

  const has = new Set(lead.tags.map((t) => t.id))
  const free = allTags.filter((t) => !has.has(t.id))

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-medium text-slate-900">{lead.name}</span>
            <span className="break-all text-slate-600">{lead.contact}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-700">{SOURCE[lead.source]}</span>
            {lead.tg_username && <span>@{lead.tg_username}</span>}
            <span>{new Date(lead.created_at).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
        </div>
        <select
          value={lead.status}
          disabled={busy}
          onChange={(e) => setStatus(e.target.value as Status)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
        >
          {Object.entries(STATUS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {lead.request && <p className="mt-2 whitespace-pre-wrap break-words text-slate-700">{lead.request}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {lead.tags.map((t) => (
          <TagChip key={t.id} tag={t} disabled={busy} onRemove={() => removeTag(t.id)} />
        ))}
        <button type="button" onClick={() => setPicker(!picker)} disabled={busy} className={`${btn} !px-2 !py-0.5`}>
          + тег
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="ml-auto text-xs text-slate-400 hover:text-red-600 disabled:opacity-50"
        >
          удалить
        </button>
      </div>

      {picker && (
        <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          {free.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {free.map((t) => (
                <TagChip key={t.id} tag={t} disabled={busy} onClick={() => addTag(t.id)} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Все теги уже на лиде.</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (newTag.trim()) createTag()
            }}
            className="flex gap-2"
          >
            <input
              className={input}
              placeholder="Новый тег"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <button className={btn} disabled={busy || !newTag.trim()}>
              Создать
            </button>
          </form>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">Не сохранилось: {error}</p>}
    </li>
  )
}
