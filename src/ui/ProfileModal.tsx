import { useState } from 'react'
import {
  activeProfile,
  addProfile,
  renameProfile,
  saveProfiles,
  type ProfileState,
} from '../lib/storage'
import { Modal } from './Modal'

type ProfileModalProps = {
  state: ProfileState
  onChange: (next: ProfileState) => void
  onClose: () => void
}

export function ProfileModal({ state, onChange, onClose }: ProfileModalProps) {
  const current = activeProfile(state)
  const [draft, setDraft] = useState(current.name)
  const [fresh, setFresh] = useState('')

  function persist(next: ProfileState) {
    saveProfiles(next)
    onChange(next)
  }

  return (
    <Modal title="Profiles" onClose={onClose}>
      <p className="mt-0 mb-4 text-sm text-[#d6c7b0]">
        Stats stick to whoever is active. Switch faces between runs — this is local, on this device only.
      </p>
      <label className="mb-4 block">
        <div className="mb-1 text-xs uppercase tracking-[0.16em] text-[#b8a38d]">Active name</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="min-w-0 flex-1"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={18}
          />
          <button
            type="button"
            className="btn shrink-0"
            onClick={() => persist(renameProfile(state, current.id, draft))}
          >
            Save
          </button>
        </div>
      </label>
      <div className="grid gap-2">
        {state.profiles.map((profile) => (
          <button
            key={profile.id}
            className={`btn text-left ${profile.id === state.activeId ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => {
              persist({ ...state, activeId: profile.id })
              setDraft(profile.name)
            }}
          >
            {profile.name}
            {profile.id === state.activeId ? ' · active' : ''}
          </button>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          className="min-w-0 flex-1"
          placeholder="New survivor name"
          value={fresh}
          maxLength={18}
          onChange={(event) => setFresh(event.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary shrink-0"
          onClick={() => {
            const next = addProfile(state, fresh)
            setFresh('')
            setDraft(activeProfile(next).name)
            persist(next)
          }}
        >
          Add
        </button>
      </div>
    </Modal>
  )
}
