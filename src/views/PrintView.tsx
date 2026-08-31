import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getChapter, type NoteRec, type VerseRef } from '../lib/db'
import { getTemplate } from '../lib/templates'
import { formatRef, formatRefs } from '../lib/refs'

// Pull the actual verse text for a ref out of a downloaded translation.
async function refText(r: VerseRef, fallbackTranslation: string): Promise<string | null> {
  const trans = r.translation || fallbackTranslation
  if (!trans) return null
  const ch = await getChapter(trans, r.book, r.chapter)
  if (!ch) return null
  const verses = ch.verses.filter(v => v.v >= r.v1 && v.v <= r.v2)
  if (!verses.length) return null
  return verses.map(v => `${v.v} ${v.t}`).join(' ')
}

export default function PrintView() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bookTitle, setBookTitle] = useState('My Bible Studies')
  const [compiled, setCompiled] = useState(false)
  const [verseTexts, setVerseTexts] = useState<Map<string, string>>(new Map())

  const notes = useLiveQuery(async () => {
    const all = await db.notes.filter(n => !n.deleted).toArray()
    return all.sort((a, b) => a.created_at.localeCompare(b.created_at))
  }, []) || []

  const defaultTranslation = useLiveQuery(async () =>
    (await db.translations.toArray())[0]?.id || '', []) || ''

  const chosen = notes.filter(n => selectedIds.has(n.id))

  // Resolve scripture text for all selected refs when compiling.
  useEffect(() => {
    if (!compiled) return
    let live = true
    ;(async () => {
      const map = new Map<string, string>()
      for (const n of chosen) {
        for (const r of n.refs) {
          const key = `${n.id}:${formatRef(r)}`
          const t = await refText(r, defaultTranslation)
          if (t) map.set(key, t)
        }
      }
      if (live) setVerseTexts(map)
    })()
    return () => { live = false }
  }, [compiled, selectedIds, defaultTranslation])

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll(kind: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      notes.filter(n => n.kind === kind).forEach(n => next.add(n.id))
      return next
    })
  }

  if (compiled) {
    return (
      <div>
        <div className="row no-print" style={{ marginBottom: 10 }}>
          <button className="btn" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
          <button className="btn secondary" onClick={() => setCompiled(false)}>← Back to selection</button>
        </div>
        <div className="book-preview">
          <div className="book-title-page">
            <h1>{bookTitle}</h1>
            <p className="muted">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="muted small">Compiled with MyVersionBible</p>
          </div>
          <div className="book-toc">
            <h2>Contents</h2>
            <ol>
              {chosen.map(n => (
                <li key={n.id}>{n.title || (n.refs.length ? formatRefs(n.refs) : 'Untitled')}</li>
              ))}
            </ol>
          </div>
          {chosen.map(n => <BookNote key={n.id} note={n} verseTexts={verseTexts} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="card">
        <h3>Compile a study book</h3>
        <p className="muted small">
          Pick the studies, journal entries, and verse notes to include; the compiled book gets a
          title page, table of contents, and the scripture text of every referenced passage.
          Use your browser's <em>Print → Save as PDF</em> to produce the file.
        </p>
        <input
          type="text" value={bookTitle} onChange={e => setBookTitle(e.target.value)}
          placeholder="Book title" style={{ width: '100%', marginBottom: 8 }}
        />
        <div className="row">
          <button className="btn secondary small" onClick={() => selectAll('study')}>All studies</button>
          <button className="btn secondary small" onClick={() => selectAll('journal')}>All journal</button>
          <button className="btn secondary small" onClick={() => selectAll('verse')}>All verse notes</button>
          <button className="btn secondary small" onClick={() => setSelectedIds(new Set())}>Clear</button>
        </div>
      </div>

      {notes.length === 0 && <p className="muted">No notes to compile yet.</p>}
      {notes.map(n => (
        <label className="card row" key={n.id} style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={selectedIds.has(n.id)} onChange={() => toggle(n.id)} />
          <div>
            <strong>{n.title || (n.refs.length ? formatRefs(n.refs) : 'Untitled')}</strong>
            <div className="meta">
              {n.kind === 'study' ? getTemplate(n.template)?.name || 'Study' : n.kind === 'journal' ? 'Journal' : 'Verse note'}
              {' · '}{new Date(n.updated_at).toLocaleDateString()}
            </div>
          </div>
        </label>
      ))}

      {selectedIds.size > 0 && (
        <button className="btn" onClick={() => setCompiled(true)}>
          Compile book ({selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'})
        </button>
      )}
    </div>
  )
}

function BookNote({ note, verseTexts }: { note: NoteRec; verseTexts: Map<string, string> }) {
  const tpl = getTemplate(note.template)
  return (
    <div className="book-note">
      <h2>{note.title || (note.refs.length ? formatRefs(note.refs) : 'Untitled')}</h2>
      {note.refs.length > 0 && <div className="refline">{formatRefs(note.refs)}</div>}
      {note.refs.map(r => {
        const t = verseTexts.get(`${note.id}:${formatRef(r)}`)
        return t ? <div className="versetext" key={formatRef(r)}><em>{formatRef(r)}</em> — {t}</div> : null
      })}
      {tpl && note.sections ? (
        tpl.sections.map(s => note.sections?.[s.id] ? (
          <div key={s.id}>
            <h4>{s.label}</h4>
            <p>{note.sections[s.id]}</p>
          </div>
        ) : null)
      ) : (
        note.content && <p>{note.content}</p>
      )}
      {note.tags.length > 0 && <p className="muted small">Tags: {note.tags.join(', ')}</p>}
    </div>
  )
}
