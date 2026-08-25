import type { ReactNode } from 'react'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, wide }: ModalProps) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={`modal-card ${wide ? 'modal-wide' : ''} panel`} role="dialog" aria-modal="true">
        <header className="flex items-center justify-between gap-3 border-b border-[#3f2a22] px-4 py-3">
          <h2 className="m-0 min-w-0 text-base tracking-[0.14em] uppercase sm:text-lg">{title}</h2>
          <button type="button" className="btn btn-ghost shrink-0 px-3 py-1" onClick={onClose} aria-label="Close">
            Close
          </button>
        </header>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  )
}
