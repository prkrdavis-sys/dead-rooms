import type { ReactNode } from 'react'
import { HEROES, type HeroId } from '../data/heroes'
import { MAPS, type MapId } from '../data/maps'
import { MODES, type ModeId } from '../data/modes'
import { DIFFICULTY_LEVELS } from '../lib/storage'
import { ChoiceRow } from './ChoiceRow'
import { HeroThumb } from './LibraryThumbs'
import { ScreenShell } from './ScreenShell'

export type SetupValue = {
  modeId: ModeId
  mapId: MapId
  heroId: HeroId
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
  tag,
  children,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  tag?: string
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
        {tag ? (
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7ea4b8]">{tag}</span>
        ) : null}
      </div>
      {children}
    </button>
  )
}

export function SetupScreen({ value, onChange, onStart, onBack }: SetupScreenProps) {
  return (
    <ScreenShell className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <header className="flex items-center gap-3">
        <button type="button" className="btn btn-ghost shrink-0" onClick={onBack}>
          Back
        </button>
        <h1 className="m-0 min-w-0 flex-1 text-lg tracking-[0.18em] uppercase sm:text-3xl">Deployment</h1>
      </header>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#22d3ee]">Mode</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((mode) => (
            <ChoiceCard
              key={mode.id}
              selected={value.modeId === mode.id}
              title={mode.name}
              tag={value.modeId === mode.id ? 'Selected' : undefined}
              onSelect={() => onChange({ ...value, modeId: mode.id })}
            >
              <p className="mt-2 text-sm text-[#a9c4d2]">{mode.tagline}</p>
              <p className="mt-2 text-xs text-[#67e8f9]">{mode.objective}</p>
            </ChoiceCard>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#22d3ee]">Operator</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HEROES.map((hero) => (
            <ChoiceCard
              key={hero.id}
              selected={value.heroId === hero.id}
              title={hero.name}
              tag={hero.role}
              onSelect={() => onChange({ ...value, heroId: hero.id })}
            >
              <div className="mt-2 flex gap-3">
                <HeroThumb hero={hero} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-sm text-[#a9c4d2]">{hero.weapon.name}</p>
                  <p className="mt-1 mb-0 text-xs text-[#7ea4b8]">
                    {hero.hp} hp · {hero.armor} armour · {hero.cone.spreadDeg}° light
                  </p>
                  <p className="mt-1 mb-0 text-xs text-[#67e8f9]">{hero.gadget.name}</p>
                </div>
              </div>
            </ChoiceCard>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-[0.2em] text-[#22d3ee]">Building</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MAPS.map((room) => (
            <ChoiceCard
              key={room.id}
              selected={value.mapId === room.id}
              title={room.name}
              onSelect={() => onChange({ ...value, mapId: room.id })}
            >
              <p className="mt-2 text-sm text-[#a9c4d2]">{room.tagline}</p>
            </ChoiceCard>
          ))}
        </div>
      </section>

      <section className="panel p-4">
        <ChoiceRow
          label="Difficulty — how sharp the opposition is"
          value={value.difficulty}
          options={DIFFICULTY_LEVELS.map((level) => ({ value: level.value, label: level.label }))}
          onChange={(difficulty) => onChange({ ...value, difficulty })}
        />
        <p className="mt-2 mb-0 text-sm text-[#a9c4d2]">
          Higher difficulty means better aim, more squads, and denser waves. Their flashlights are just as honest as yours.
        </p>
      </section>

      <div className="setup-start">
        <button type="button" className="btn btn-primary w-full py-4 text-lg tracking-[0.18em]" onClick={onStart}>
          Go dark
        </button>
      </div>
    </ScreenShell>
  )
}
