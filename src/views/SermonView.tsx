import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteNote, type NoteRec } from '../lib/db'
import { formatRefs } from '../lib/refs'
import { parsePoints, sermonNotes, sermonSubtitle, studyFromSermon } from '../lib/sermons'
import SermonEditor from '../components/SermonEditor'

/**
 * Sermon notes as a listener: one place to take them while they are being
 * preached, and to come back to them afterwards to study deeper.
 */
export default function SermonView() {
  const [editing, setEditing] = useState<NoteRec | 'new' | null>(null)
  const [search, setSearch] = useState('')
  const notes = useLiveQuery(() => sermonNotes(), []) || []
  const studies = useLiveQuery(
    () => db.notes.where('kind').equals('study').and(n => !n.deleted && n.tags.includes('from-sermon')).toArray(),
    []
  ) || []

  if (editing) {
    return (
      <div>
        <div className="row" style={{ marginBottom: 10 }}>
          <button className="btn secondary small" onClick={() => setEditing(null)}>← All sermons</button>
        </div>
        <SermonEditor
          key={editing === 'new' ? 'new' : editing.id}
          note={editing === 'new' ? undefined : editing}
          onDone={() => setEditing(null)}
        />
      </div>
    )
  }

  const q = search.trim().toLowerCase()
  const shown = q
    ? notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        formatRefs(n.refs).toLowerCase().includes(q) ||
        Object.values(n.sections || {}).some(s => s.toLowerCase().includes(q)) ||
        n.tags.some(t => t.toLowerCase().includes(q)))
    : notes

  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={() => setEditing('new')}>+ New sermon</button>
        <div style={{ flex: 1 }} />
        <input
          type="text" placeholder="Search sermons…" value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {notes.length === 0 && (
        <div className="card">
          <h3>Notes while you listen</h3>
          <p className="muted small">
            Put in the reference being preached on and the passage opens beside your notes —
            its background, its cross references, and the Hebrew or Greek behind any word you
            tap. Capture points straight off the text as you hear them, then turn the whole
            thing into a study of your own afterwards.
          </p>
          <button className="btn" onClick={() => setEditing('new')}>Start a sermon note</button>
        </div>
      )}

      {shown.map(n => {
        const points = parsePoints(n.sections?.points)
        const questions = (n.sections?.questions || '').split('\n').filter(l => l.trim())
        const study = studies.find(s => s.refs.length && formatRefs(s.refs) === formatRefs(n.refs))
        return (
          <div className="card" key={n.id} onClick={() => setEditing(n)} style={{ cursor: 'pointer' }}>
            <h3>{n.title || (n.refs.length ? formatRefs(n.refs) : 'Untitled sermon')}</h3>
            <div className="meta">
              {n.refs.length > 0 && <span className="sermon-ref">{formatRefs(n.refs)}</span>}
              {sermonSubtitle(n) && ` · ${sermonSubtitle(n)}`}
            </div>
            {n.sections?.bigidea && <p className="small" style={{ margin: '6px 0 0' }}>{n.sections.bigidea}</p>}
            <div className="meta" style={{ marginTop: 6 }}>
              {points.length} point{points.length === 1 ? '' : 's'}
              {questions.length > 0 && ` · ${questions.length} to study`}
              {study && ' · study started'}
            </div>
            <div style={{ marginTop: 6 }}>
              {n.tags.map(t => <span className="tag" key={t}>{t}</span>)}
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="btn secondary small"
                onClick={async e => { e.stopPropagation(); await studyFromSermon(n) }}
                title="Start an inductive study from this sermon"
              >📚 Study deeper</button>
              <button
                className="btn secondary small"
                onClick={e => { e.stopPropagation(); if (confirm('Delete this sermon note?')) deleteNote(n.id) }}
              >Delete</button>
            </div>
          </div>
        )
      })}

      {notes.length > 0 && shown.length === 0 && <p className="muted">Nothing matches that.</p>}
    </div>
  )
}
