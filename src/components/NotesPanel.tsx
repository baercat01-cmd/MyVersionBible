import type { ReactNode } from 'react'
import type { NoteRec } from '../lib/db'
import { getTemplate } from '../lib/templates'
import { formatRefs } from '../lib/refs'

interface Props {
  notes: NoteRec[]
  reference: string
  onOpen: (note: NoteRec) => void
  onNew: () => void
  canAdd: boolean
  /** Close the panel — the only obvious way out when it covers the text. */
  onClose?: () => void
  /** Rendered above the notes — the cross references for the current selection. */
  children?: ReactNode
}

/** Study notes for the chapter on screen, shown beside the text. */
export default function NotesPanel({ notes, reference, onOpen, onNew, canAdd, children, onClose }: Props) {
  return (
    <aside className="notescol no-print">
      <div className="notescol-head">
        <strong>Notes · {reference}</strong>
        {onClose && (
          <button className="notescol-close" onClick={onClose} aria-label="Close notes">✕</button>
        )}
      </div>

      {children}

      {notes.length === 0 && (
        <p className="muted small">
          No notes on this chapter yet. Tap a verse number or any word in the text,
          then use <strong>+ Note</strong> to write one here.
        </p>
      )}

      {notes.map(n => {
        const tpl = getTemplate(n.template)
        const preview = n.content || Object.values(n.sections || {}).find(Boolean) || ''
        return (
          <button className="notecard" key={n.id} onClick={() => onOpen(n)}>
            <div className="notecard-ref">{formatRefs(n.refs) || 'Untitled'}</div>
            {n.title && <div className="notecard-title">{n.title}</div>}
            {tpl && <div className="meta">{tpl.name}</div>}
            {preview && (
              <p className="small muted">
                {preview.slice(0, 120)}{preview.length > 120 ? '…' : ''}
              </p>
            )}
            {n.tags.length > 0 && (
              <div>{n.tags.map(t => <span className="tag" key={t}>{t}</span>)}</div>
            )}
          </button>
        )
      })}

      <button className="btn small" onClick={onNew} disabled={!canAdd}>
        + Note on selection
      </button>
      {!canAdd && <p className="muted small">Select a verse or words first.</p>}
    </aside>
  )
}
