import { useState } from 'react'
import { ENEMIES } from '../data/enemies'
import { MAPS } from '../data/maps'
import { SPECIALS } from '../data/specials'
import { WEAPONS } from '../data/weapons'
import { EnemyThumb, MapThumb, SpecialThumb, WeaponThumb } from './LibraryThumbs'
import { Modal } from './Modal'

type Tab = 'enemies' | 'arsenal' | 'rooms'

export function LibraryModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('enemies')
  const tabs: { id: Tab; label: string }[] = [
    { id: 'enemies', label: 'Hostiles' },
    { id: 'arsenal', label: 'Arsenal' },
    { id: 'rooms', label: 'Rooms' },
  ]

  return (
    <Modal title="Containment Library" onClose={onClose} wide>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`btn ${tab === item.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'enemies' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {ENEMIES.map((enemy) => (
            <article
              key={enemy.id}
              className="flex gap-3 rounded-lg border border-[#3f2a22] bg-[#1a1010] p-3"
            >
              <EnemyThumb enemy={enemy} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="m-0 text-base tracking-wide uppercase">{enemy.name}</h3>
                  <span className="text-xs uppercase tracking-widest text-[#d4a017]">{enemy.role}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#d6c7b0]">{enemy.blurb}</p>
                <p className="mt-2 text-xs text-[#f87171]">Tell: {enemy.tell}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs uppercase tracking-wider text-[#b8a38d]">
                  <div>
                    <dt>HP</dt>
                    <dd className="text-[#f3e6d0]">{enemy.hp}</dd>
                  </div>
                  <div>
                    <dt>Speed</dt>
                    <dd className="text-[#f3e6d0]">{enemy.speed}</dd>
                  </div>
                  <div>
                    <dt>Dmg</dt>
                    <dd className="text-[#f3e6d0]">{enemy.damage}</dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
      {tab === 'arsenal' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {WEAPONS.map((weapon) => (
            <article
              key={weapon.id}
              className="flex gap-3 rounded-lg border border-[#3f2a22] bg-[#1a1010] p-3"
            >
              <WeaponThumb id={weapon.id} name={weapon.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="m-0 text-base tracking-wide uppercase">
                    [{weapon.keyLabel}] {weapon.name}
                  </h3>
                  <span className="text-xs uppercase tracking-widest text-[#d4a017]">{weapon.short}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[#d6c7b0]">{weapon.blurb}</p>
                <p className="mt-2 text-xs text-[#b8a38d]">
                  {weapon.infiniteAmmo ? 'Infinite ammo' : `Mag ${weapon.ammoMax}`} · {weapon.damage} dmg
                </p>
              </div>
            </article>
          ))}
          {SPECIALS.map((special) => (
            <article
              key={special.id}
              className="flex gap-3 rounded-lg border border-[#5b2e24] bg-[#201010] p-3"
            >
              <SpecialThumb id={special.id} name={special.name} />
              <div className="min-w-0 flex-1">
                <h3 className="m-0 text-base tracking-wide uppercase">Special · {special.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#d6c7b0]">{special.blurb}</p>
                <p className="mt-2 text-xs text-[#f87171]">{special.how}</p>
              </div>
            </article>
          ))}
        </div>
      )}
      {tab === 'rooms' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {MAPS.map((room) => (
            <article
              key={room.id}
              className="flex gap-3 rounded-lg border border-[#3f2a22] bg-[#1a1010] p-3"
            >
              <MapThumb room={room} />
              <div className="min-w-0 flex-1">
                <h3 className="m-0 text-base tracking-wide uppercase">{room.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#d6c7b0]">{room.tagline}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </Modal>
  )
}
