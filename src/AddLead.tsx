import { useState } from 'react'
import { api, type Lead } from './api'
import { btn, btnPrimary, input } from './ui'

export default function AddLead({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [request, setRequest] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api<Lead>('/api/leads', { method: 'POST', body: JSON.stringify({ name, contact, request }) })
      onDone()
    } catch (err) {
      setError(`Не удалось сохранить: ${(err as Error).message}`)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-medium text-slate-900">Новый лид</h2>
      <input className={input} placeholder="Имя *" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        className={input}
        placeholder="Контакт: телефон, почта или @ник *"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />
      <textarea
        className={input}
        rows={3}
        placeholder="Запрос"
        value={request}
        onChange={(e) => setRequest(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button className={btnPrimary} disabled={busy || !name.trim() || !contact.trim()}>
          {busy ? 'Сохраняю…' : 'Добавить'}
        </button>
        <button type="button" className={btn} onClick={onCancel} disabled={busy}>
          Отмена
        </button>
      </div>
    </form>
  )
}
