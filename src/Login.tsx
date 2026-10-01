import { useState } from 'react'
import { api, setKey, Unauthorized } from './api'

export default function Login({ onOk }: { onOk: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setKey(code.trim())
    try {
      await api('/api/leads')
      onOk()
    } catch (err) {
      setKey('')
      setError(err instanceof Unauthorized ? 'Неверный код доступа' : `Не удалось проверить код: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto mt-24 max-w-sm px-4">
      <h1 className="text-2xl font-semibold text-slate-900">Мини-CRM</h1>
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="block text-sm text-slate-700">
          Код доступа
          <input
            autoFocus
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-slate-500"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={busy || !code.trim()}
          className="w-full rounded-lg bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
        >
          {busy ? 'Проверяю…' : 'Войти'}
        </button>
      </form>
    </main>
  )
}
