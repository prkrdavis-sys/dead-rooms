import { saveSettings, type Settings } from '../lib/storage'
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
        <label className="block">
          <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.16em] text-[#b8a38d]">
            <span>Music</span>
            <span>{Math.round(settings.music * 100)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.music}
            onChange={(event) => patch({ music: Number(event.target.value) })}
          />
        </label>
        <label className="block">
          <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.16em] text-[#b8a38d]">
            <span>Sound</span>
            <span>{Math.round(settings.sfx * 100)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.sfx}
            onChange={(event) => patch({ sfx: Number(event.target.value) })}
          />
        </label>
        <label className="block">
          <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.16em] text-[#b8a38d]">
            <span>Gore</span>
            <span>{settings.gore}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={settings.gore}
            onChange={(event) => patch({ gore: Number(event.target.value) })}
          />
          <p className="mt-2 text-sm leading-relaxed text-[#d6c7b0]">
            How much blood hits the floor, and how many body chunks stay behind. Phones cap the mess so the frame rate stays up.
          </p>
        </label>
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
