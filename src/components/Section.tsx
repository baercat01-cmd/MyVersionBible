import { useState, type ReactNode } from 'react'

interface Props {
  label: string
  /** Shown beside the label — how much is in there, so it need not be opened to know. */
  badge?: string
  startOpen?: boolean
  children: ReactNode
}

/** A part of a long form that stays folded away until it is wanted. */
export default function Section({ label, badge, startOpen, children }: Props) {
  const [open, setOpen] = useState(!!startOpen)
  return (
    <div className={`fold ${open ? 'fold-open' : ''}`}>
      <button className="fold-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="fold-chevron">{open ? '▾' : '▸'}</span>
        <span className="fold-label">{label}</span>
        {badge && <span className="fold-badge">{badge}</span>}
      </button>
      {open && <div className="fold-body">{children}</div>}
    </div>
  )
}
