import type { ReactNode } from 'react'

type ScreenShellProps = {
  children: ReactNode
  className?: string
}

export function ScreenShell({ children, className = '' }: ScreenShellProps) {
  return (
    <div data-allow-touch-scroll className={['screen-shell', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
