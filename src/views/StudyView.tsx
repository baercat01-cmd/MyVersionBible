import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteNote, type NoteRec } from '../lib/db'
import { getTemplate } from '../lib/templates'
import { formatRefs } from '../lib/refs'
import NoteEditor from '../components/NoteEditor'
import { connectionsFor, threads, type Connection, type Thread } from '../lib/connections'

type Filter = 'study' | 'journal' | 'verse'

export default function StudyView() {
  const [filter, setFilter] = useState<Filter>('study')
  const [editing, setEditing] = useState<NoteRec | 'new' | null>(null)
  const [search, setSearch] = useState('')
  const [related, setRelated] = useState<{ id: string; items: Connection[] } | null>(null)
  const [showThreads, setShowThreads] = useState(false)
  const [threadList, setThreadList] = useState<Thread[] | null>(null)

  async function showRelated(n: NoteRec) {
    if (related?.id === n.id) { setRelated(null); return }
    setRelated({ id: n.id, items: await connectionsFor(n) })
  }

  async function toggleThreads() {
    if (showThreads) { setShowThreads(false); return }
    setThreadList(await threads())
    setShowThreads(true)
  }

  const notes = useLiveQuery(async () => {
    const all = await db.notes.where('kind').equals(filter).and(n => !n.deleted).toArray()
    return all.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  }, [filter]) || []

  const q = search.trim().toLowerCase()
  const shown = q
    ? notes.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        Object.values(n.sections || {}).some(s => s.toLowerCase().includes(q)) ||
        n.tags.some(t => t.toLowerCase().includes(q)))
    : notes

  if (editing) {
    return (
      <NoteEditor
        note={editing === 'new' ? undefined : editing}
        kind={filter}
        onDone={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="stack">
      <div className="row">
        {(['study', 'journal', 'verse'] as Filter[]).map(f => (
          <button key={f} className={`btn small ${filter === f ? '' : 'secondary'}`} onClick={() => setFilter(f)}>
            {f === 'study' ? 'Studies' : f === 'journal' ? 'Journal' : 'Verse notes'}
          </button>
        ))}
        <div className="spacer" style={{ flex: 1 }} />
        {filter !== 'verse' && (
          <button className="btn small" onClick={() => setEditing('new')}>
            + New {filter === 'study' ? 'study' : 'entry'}
          </button>
        )}
        <button className={`btn small ${showThreads ? '' : 'secondary'}`} onClick={toggleThreads}>
          🧵 Threads
        </button>
      </div>

      {showThreads && (
        <div className="card">
          <h3>Threads running through your study</h3>
          <p className="muted small">
            Tags and words that keep coming up across separate notes — worked out on
            this device from what you have written, with nothing sent anywhere.
          </p>
          {threadList && threadList.length === 0 && (
            <p className="muted small">Nothing recurs across three or more notes yet.</p>
          )}
          {(threadList || []).map(t => (
            <div className="row threadrow" key={t.kind + t.term}>
              <span className={t.kind === 'tag' ? 'tag' : 'threadword'}>{t.term}</span>
              <span className="meta">{t.notes.length} notes</span>
              <span className="small muted">
                {t.notes.slice(0, 3).map(n => n.title || formatRefs(n.refs) || 'Untitled').join(' · ')}
                {t.notes.length > 3 && ' …'}
              </span>
            </div>
          ))}
        </div>
      )}

      <input
        type="text" placeholder="Search notes…"
        value={search} onChange={e => setSearch(e.target.value)}
      />

      {shown.length === 0 && (
        <p className="muted">
          {filter === 'verse'
            ? 'No verse notes yet — select verses in the Read tab to highlight or annotate them.'
            : 'Nothing here yet.'}
        </p>
      )}

      {shown.map(n => {
        const tpl = getTemplate(n.template)
        const preview = n.content || Object.values(n.sections || {}).find(Boolean) || ''
        return (
          <div className="card" key={n.id} onClick={() => setEditing(n)} style={{ cursor: 'pointer' }}>
            <h3>{n.title || (n.refs.length ? formatRefs(n.refs) : 'Untitled')}</h3>
            <div className="meta">
              {tpl ? `${tpl.name} · ` : ''}
              {n.refs.length > 0 && `${formatRefs(n.refs)} · `}
              {new Date(n.updated_at).toLocaleDateString()}
            </div>
            {preview && <p className="small" style={{ margin: '6px 0 0' }}>{preview.slice(0, 160)}{preview.length > 160 ? '…' : ''}</p>}
            <div style={{ marginTop: 6 }}>
              {n.tags.map(t => <span className="tag" key={t}>{t}</span>)}
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <button
                className="btn secondary small"
                onClick={e => { e.stopPropagation(); showRelated(n) }}
              >🔗 Related</button>
              <button
                className="btn secondary small"
                onClick={e => { e.stopPropagation(); if (confirm('Delete this note?')) deleteNote(n.id) }}
              >Delete</button>
            </div>

            {related?.id === n.id && (
              <div className="xref-block" style={{ marginTop: 8 }} onClick={e => e.stopPropagation()}>
                <div className="xref-head">Related in your own study</div>
                {related.items.length === 0 && (
                  <p className="muted small">
                    Nothing else of yours touches this yet.
                  </p>
                )}
                {related.items.map(c => (
                  <button className="xref" key={c.note.id} onClick={() => setEditing(c.note)}>
                    <span className="xref-ref">
                      {c.note.title || formatRefs(c.note.refs) || 'Untitled'}
                    </span>
                    <span className="xref-text muted">{c.reasons.slice(0, 2).join(' · ')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
