import { useState } from 'react'
import { ENEMIES } from '../data/enemies'
import { HEROES } from '../data/heroes'
import { MAPS } from '../data/maps'
import { MODES } from '../data/modes'
import { EnemyThumb, GadgetThumb, HeroThumb, MapThumb } from './LibraryThumbs'
import { Modal } from './Modal'

type Tab = 'operators' | 'modes' | 'hostiles' | 'rooms'

const CARD = 'flex min-w-0 gap-3 rounded-lg border border-[#1e3a4a] bg-[#0a1017] p-3'

export function LibraryModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('operators')
  const tabs: { id: Tab; label: string }[] = [
    { id: 'operators', label: 'Operators' },
    { id: 'modes', label: 'Modes' },
    { id: 'hostiles', label: 'Hostiles' },
    { id: 'rooms', label: 'Buildings' },
  ]

  return (
    <Modal title="Field Manual" onClose={onClose} wide>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`btn px-2 py-2 text-sm ${tab === item.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'operators' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {HEROES.map((hero) => (
            <article key={hero.id} className={CARD}>
              <HeroThumb hero={hero} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="m-0 text-base tracking-wide uppercase">{hero.name}</h3>
                  <span className="text-xs uppercase tracking-widest text-[#22d3ee]">{hero.role}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#a9c4d2]">{hero.blurb}</p>
                <p className="mt-2 text-xs text-[#67e8f9]">Tell: {hero.tell}</p>
                <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs uppercase tracking-wider text-[#7ea4b8]">
                  <div>
                    <dt>HP</dt>
                    <dd className="text-[#d8ecf5]">{hero.hp}</dd>
                  </div>
                  <div>
                    <dt>Armour</dt>
                    <dd className="text-[#d8ecf5]">{hero.armor}</dd>
                  </div>
                  <div>
                    <dt>Light</dt>
                    <dd className="text-[#d8ecf5]">
                      {hero.cone.range}/{hero.cone.spreadDeg}°
                    </dd>
                  </div>
                  <div>
                    <dt>Mag</dt>
                    <dd className="text-[#d8ecf5]">{hero.weapon.mag}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
          {HEROES.map((hero) => (
            <article key={`${hero.id}-gadget`} className="flex min-w-0 gap-3 rounded-lg border border-[#164e63] bg-[#08131a] p-3">
              <GadgetThumb id={hero.gadget.id} name={hero.gadget.name} />
              <div className="min-w-0 flex-1">
                <h3 className="m-0 text-base tracking-wide uppercase">
                  {hero.name} · {hero.gadget.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#a9c4d2]">{hero.gadget.blurb}</p>
                <p className="mt-2 text-xs text-[#7ea4b8]">Cooldown {Math.round(hero.gadget.cooldownMs / 100) / 10}s</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'modes' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((mode) => (
            <article key={mode.id} className={CARD}>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="m-0 text-base tracking-wide uppercase">{mode.name}</h3>
                  <span className="text-xs uppercase tracking-widest text-[#22d3ee]">{mode.objective}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#a9c4d2]">{mode.tagline}</p>
                <p className="mt-2 text-xs text-[#67e8f9]">{mode.how}</p>
              </div>
            </article>
          ))}
          <article className={CARD}>
            <div className="min-w-0 flex-1">
              <h3 className="m-0 text-base tracking-wide uppercase">The dark</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#a9c4d2]">
                You see your own cone, your squad&apos;s cones, and whatever the building still has lit. Floorplan you have
                already walked stays faintly remembered; the people in it do not. Lamps can be shot out, breakers flip a
                whole wing, and dropped flashlights keep burning on corpses.
              </p>
              <p className="mt-2 text-xs text-[#67e8f9]">
                Standing still and holding fire makes you much harder to spot. Firing an unsilenced gun paints your
                position for everyone in earshot.
              </p>
            </div>
          </article>
        </div>
      )}

      {tab === 'hostiles' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {ENEMIES.map((enemy) => (
            <article key={enemy.id} className={CARD}>
              <EnemyThumb enemy={enemy} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="m-0 text-base tracking-wide uppercase">{enemy.name}</h3>
                  <span className="text-xs uppercase tracking-widest text-[#22d3ee]">{enemy.role}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#a9c4d2]">{enemy.blurb}</p>
                <p className="mt-2 text-xs text-[#67e8f9]">Tell: {enemy.tell}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'rooms' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {MAPS.map((room) => (
            <article key={room.id} className={CARD}>
              <MapThumb room={room} />
              <div className="min-w-0 flex-1">
                <h3 className="m-0 text-base tracking-wide uppercase">{room.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#a9c4d2]">{room.tagline}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </Modal>
  )
}
