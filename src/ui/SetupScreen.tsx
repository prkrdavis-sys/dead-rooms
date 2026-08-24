import type { ReactNode } from 'react'
import { MAPS, type MapId } from '../data/maps'
import { SPECIALS, type SpecialId } from '../data/specials'

export type SetupValue = {
  mapId: MapId
  specialId: SpecialId
  difficulty: number
}

type SetupScreenProps = {
  value: SetupValue
  onChange: (next: SetupValue) => void
  onStart: () => void
  onBack: () => void
}

function ChoiceCard({
  selected,
  onSelect,
  title,
  children,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`panel p-4 text-left ${selected ? 'is-selected' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-bold uppercase tracking-wider">{title}</div>
        {selected ? (
          <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-[#e11d48]">Selected</span>
        ) : null}
      </div>
      {children}
    </button>
  )
}

export function SetupScreen({ value, onChange, onStart, onBack }: SetupScreenProps) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-5 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
        <h1 className="m-0 text-xl tracking-[0.18em] uppercase sm:text-3xl">Choose the room</h1>
        <span className="w-16" />
      </header>
      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#d4a017]">Map</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MAPS.map((room) => (
            <ChoiceCard
              key={room.id}
              selected={value.mapId === room.id}
              title={room.name}
              onSelect={() => onChange({ ...value, mapId: room.id })}
            >
              <p className="mt-2 text-sm text-[#d6c7b0]">{room.tagline}</p>
            </ChoiceCard>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#d4a017]">Special move</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {SPECIALS.map((special) => (
            <ChoiceCard
              key={special.id}
              selected={value.specialId === special.id}
              title={special.name}
              onSelect={() => onChange({ ...value, specialId: special.id })}
            >
              <p className="mt-2 text-sm text-[#d6c7b0]">{special.blurb}</p>
              <p className="mt-2 text-xs text-[#f87171]">{special.how}</p>
            </ChoiceCard>
          ))}
        </div>
      </section>
      <section className="panel p-4">
        <div className="mb-2 flex justify-between text-xs uppercase tracking-[0.16em] text-[#b8a38d]">
          <span>Difficulty — how many come per round</span>
          <span>{value.difficulty}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={value.difficulty}
          onChange={(event) => onChange({ ...value, difficulty: Number(event.target.value) })}
        />
        <p className="mt-2 mb-0 text-sm text-[#d6c7b0]">
          1 is a warm-up. 10 is a meat grinder. Enemy counts scale; the tells stay honest.
        </p>
      </section>
      <button type="button" className="btn btn-primary py-4 text-lg tracking-[0.18em]" onClick={onStart}>
        Enter the room
      </button>
    </div>
  )
}
