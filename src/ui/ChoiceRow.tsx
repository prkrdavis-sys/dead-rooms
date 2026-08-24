export type ChoiceOption<T> = {
  value: T
  label: string
}

type ChoiceRowProps<T> = {
  label: string
  value: T
  options: readonly ChoiceOption<T>[]
  onChange: (value: T) => void
}

export function ChoiceRow<T>({ label, value, options, onChange }: ChoiceRowProps<T>) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[#b8a38d]">{label}</div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <button
              key={String(option.value)}
              type="button"
              className={`btn px-3 py-2 ${selected ? 'btn-primary' : 'btn-ghost'}`}
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
