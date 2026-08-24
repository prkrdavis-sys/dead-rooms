import { GORE_LEVELS, VOLUME_LEVELS, saveSettings, type Settings } from '../lib/storage'
import { ChoiceRow } from './ChoiceRow'
import { Modal } from './Modal'

type SettingsModalProps = {
  settings: Settings
  onChange: (next: Settings) => void
  onClose: () => void
}

export function SettingsModal({ settings, onChange, onClose }: SettingsModalProps) {
  function patch(partial: Partial<Settings>) {
    const next = { ...settings, ...partial }
    onChange(next)
    saveSettings(next)
  }

  return (
    <Modal title="Settings" onClose={onClose}>
      <section className="grid gap-5">
        <div className="grid gap-3">
          <ChoiceRow
            label="Music"
            value={settings.musicOn}
            options={[
              { value: true, label: 'On' },
              { value: false, label: 'Off' },
            ]}
            onChange={(musicOn) => patch({ musicOn })}
          />
          <ChoiceRow
            label="Music volume"
            value={settings.music}
            options={VOLUME_LEVELS.map((level) => ({ value: level.value, label: level.label }))}
            onChange={(music) => patch({ music, musicOn: true })}
          />
        </div>
        <div className="grid gap-3">
          <ChoiceRow
            label="Sound"
            value={settings.sfxOn}
            options={[
              { value: true, label: 'On' },
              { value: false, label: 'Off' },
            ]}
            onChange={(sfxOn) => patch({ sfxOn })}
          />
          <ChoiceRow
            label="Sound volume"
            value={settings.sfx}
            options={VOLUME_LEVELS.map((level) => ({ value: level.value, label: level.label }))}
            onChange={(sfx) => patch({ sfx, sfxOn: true })}
          />
        </div>
        <div>
          <ChoiceRow
            label="Gore"
            value={settings.gore}
            options={GORE_LEVELS.map((level) => ({ value: level.value, label: level.label }))}
            onChange={(gore) => patch({ gore })}
          />
          <p className="mt-2 mb-0 text-sm leading-relaxed text-[#d6c7b0]">
            How much blood hits the floor, and how many body chunks stay behind. Phones cap the mess so the frame rate stays up.
          </p>
        </div>
        <div className="rounded-lg border border-[#3f2a22] bg-[#1a1010] p-3 text-sm leading-relaxed text-[#d6c7b0]">
          <h3 className="mt-0 mb-2 text-xs uppercase tracking-[0.16em] text-[#d4a017]">Controls</h3>
          <ul className="m-0 grid list-none gap-1 p-0">
            <li>Move — WASD or Arrow keys</li>
            <li>Fire — Space (the way you last walked)</li>
            <li>Special — Shift (the move you picked before the run)</li>
            <li>Weapons — 1 2 3 4 5 6 7 8 9 0</li>
            <li>Charge Packs — tap Space to plant, hold Space to detonate</li>
            <li>Pause — P or Escape</li>
            <li>Phone — stick, Fire, Special, and the weapon strip</li>
          </ul>
        </div>
        <p className="m-0 text-xs text-[#b8a38d]">Click outside this window to close it.</p>
      </section>
    </Modal>
  )
}
