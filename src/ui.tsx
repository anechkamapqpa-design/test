import type { Tag } from './api'

// Полные имена классов, чтобы Tailwind их увидел при сборке.
const COLOR: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  amber: 'bg-amber-100 text-amber-800 border-amber-200',
  emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  sky: 'bg-sky-100 text-sky-800 border-sky-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200',
  pink: 'bg-pink-100 text-pink-800 border-pink-200',
}
export const TAG_COLORS = Object.keys(COLOR)

export function TagChip({
  tag,
  active,
  onClick,
  onRemove,
  disabled,
  suffix,
}: {
  tag: Tag
  active?: boolean
  onClick?: () => void
  onRemove?: () => void
  disabled?: boolean
  suffix?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm ${COLOR[tag.color] ?? COLOR.slate} ${
        active ? 'ring-2 ring-slate-900 ring-offset-1' : ''
      }`}
    >
      {onClick ? (
        <button type="button" onClick={onClick} disabled={disabled} className="disabled:opacity-50">
          {tag.name}
          {suffix && <span className="ml-1 opacity-60">{suffix}</span>}
        </button>
      ) : (
        <span>{tag.name}</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Снять тег ${tag.name}`}
          className="-mr-1 px-1 leading-none opacity-60 hover:opacity-100 disabled:opacity-30"
        >
          ×
        </button>
      )}
    </span>
  )
}

export const btn =
  'rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50'
export const btnPrimary = 'rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50'
export const input =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none focus:border-slate-500 sm:text-sm'
