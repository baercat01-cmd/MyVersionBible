import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getChapter, saveNote, type NoteRec, type VerseRef } from '../lib/db'
import { bookName } from '../lib/books'
import NoteEditor from '../components/NoteEditor'

interface Position { translation: string; book: number; chapter: number; parallel: string }

const POS_KEY = 'mvb-position'

function loadPos(): Position {
  try {
    const p = JSON.parse(localStorage.getItem(POS_KEY) || '')
    if (p && p.translation) return { parallel: '', ...p }
  } catch { /* fresh start */ }
  return { translation: '', book: 43, chapter: 1, parallel: '' }
}

const HIGHLIGHTS = [
  { id: 'yellow', css: 'hl-yellow', dot: '#f6e7a9' },
  { id: 'green', css: 'hl-green', dot: '#d4e8c6' },
  { id: 'blue', css: 'hl-blue', dot: '#cfe0ef' },
  { id: 'pink', css: 'hl-pink', dot: '#f3d3dc' }
]

export default function ReaderView() {
  const [pos, setPos] = useState<Position>(loadPos)
  const [selected, setSelected] = useState<number[]>([])
  const [editing, setEditing] = useState<NoteRec | 'new' | null>(null)

  const translations = useLiveQuery(() => db.translations.toArray(), []) || []

  // Adopt the first downloaded translation automatically.
  useEffect(() => {
    if (translations.length && !translations.find(t => t.id === pos.translation)) {
      setPos(p => ({ ...p, translation: translations[0].id }))
    }
  }, [translations.length])

  useEffect(() => { localStorage.setItem(POS_KEY, JSON.stringify(pos)) }, [pos])
  useEffect(() => { setSelected([]) }, [pos.translation, pos.book, pos.chapter])

  const current = translations.find(t => t.id === pos.translation)
  const bookMeta = current?.books.find(b => b.bookid === pos.book)

  const chapterRec = useLiveQuery(
    () => pos.translation ? getChapter(pos.translation, pos.book, pos.chapter) : undefined,
    [pos.translation, pos.book, pos.chapter]
  )
  const parallelRec = useLiveQuery(
    () => pos.parallel ? getChapter(pos.parallel, pos.book, pos.chapter) : undefined,
    [pos.parallel, pos.book, pos.chapter]
  )

  // Verse-anchored notes touching this chapter.
  const chapterNotes = useLiveQuery(async () => {
    const all = await db.notes.where('kind').equals('verse').and(n => !n.deleted).toArray()
    return all.filter(n => n.refs.some(r => r.book === pos.book && r.chapter === pos.chapter))
  }, [pos.book, pos.chapter]) || []

  const verseMarks = useMemo(() => {
    const marks = new Map<number, { color: string | null; hasNote: boolean; note: NoteRec }>()
    for (const n of chapterNotes) {
      for (const r of n.refs) {
        if (r.book !== pos.book || r.chapter !== pos.chapter) continue
        for (let v = r.v1; v <= r.v2; v++) {
          const prev = marks.get(v)
          marks.set(v, {
            color: n.color || prev?.color || null,
            hasNote: (prev?.hasNote || false) || !!(n.content || n.title),
            note: n
          })
        }
      }
    }
    return marks
  }, [chapterNotes, pos.book, pos.chapter])

  function toggleVerse(v: number) {
    setSelected(sel => {
      if (sel.includes(v)) return sel.filter(x => x !== v)
      const next = [...sel, v].sort((a, b) => a - b)
      // Keep selection contiguous for a clean range reference.
      const min = next[0], max = next[next.length - 1]
      return Array.from({ length: max - min + 1 }, (_, i) => min + i)
    })
  }

  function selectionRefs(): VerseRef[] {
    if (!selected.length) return []
    return [{
      book: pos.book, chapter: pos.chapter,
      v1: selected[0], v2: selected[selected.length - 1],
      translation: pos.translation
    }]
  }

  async function applyHighlight(color: string | null) {
    const refs = selectionRefs()
    if (!refs.length) return
    await saveNote({ kind: 'verse', title: '', content: '', refs, color })
    setSelected([])
  }

  function goChapter(delta: number) {
    if (!current) return
    let b = pos.book, c = pos.chapter + delta
    const idx = current.books.findIndex(x => x.bookid === b)
    if (c < 1) {
      if (idx > 0) { b = current.books[idx - 1].bookid; c = current.books[idx - 1].chapters }
      else return
    } else if (bookMeta && c > bookMeta.chapters) {
      if (idx < current.books.length - 1) { b = current.books[idx + 1].bookid; c = 1 }
      else return
    }
    setPos(p => ({ ...p, book: b, chapter: c }))
    window.scrollTo(0, 0)
  }

  if (!translations.length) {
    return (
      <div className="card">
        <h3>Welcome 👋</h3>
        <p>No Bible text is on this device yet. Open the <strong>Versions</strong> tab and download one (KJV, Darby, WEB…) — after that, everything reads offline.</p>
      </div>
    )
  }

  const isRTL = pos.translation === 'WLC'

  return (
    <div>
      <div className="row no-print" style={{ marginBottom: 10 }}>
        <select value={pos.translation} onChange={e => setPos(p => ({ ...p, translation: e.target.value }))}>
          {translations.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
        </select>
        <select value={pos.book} onChange={e => setPos(p => ({ ...p, book: +e.target.value, chapter: 1 }))}>
          {(current?.books || []).map(b => <option key={b.bookid} value={b.bookid}>{b.name}</option>)}
        </select>
        <select value={pos.chapter} onChange={e => setPos(p => ({ ...p, chapter: +e.target.value }))}>
          {Array.from({ length: bookMeta?.chapters || 1 }, (_, i) => i + 1).map(c =>
            <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={pos.parallel} onChange={e => setPos(p => ({ ...p, parallel: e.target.value }))} title="Parallel version">
          <option value="">— parallel —</option>
          {translations.filter(t => t.id !== pos.translation).map(t =>
            <option key={t.id} value={t.id}>{t.id}</option>)}
        </select>
      </div>

      <div className={`reader ${parallelRec ? 'parallel' : ''}`}>
        <div className={isRTL ? 'rtl' : ''}>
          <h2>{bookName(pos.book, bookMeta?.name)} {pos.chapter} <span className="muted small">({pos.translation})</span></h2>
          {!chapterRec && <p className="muted">Chapter not found in this version.</p>}
          {chapterRec?.verses.map(({ v, t }) => {
            const mark = verseMarks.get(v)
            const cls = [
              'verse',
              selected.includes(v) ? 'selected' : '',
              mark?.color ? `hl-${mark.color}` : ''
            ].join(' ')
            return (
              <span key={v} className={cls} onClick={() => toggleVerse(v)}>
                <span className="vnum">{v}</span>
                {t}
                {mark?.hasNote && <span className="notemark" onClick={e => { e.stopPropagation(); setEditing(mark.note) }}>✏️</span>}{' '}
              </span>
            )
          })}
        </div>
        {parallelRec && (
          <div className={pos.parallel === 'WLC' ? 'rtl' : ''}>
            <h2 className="muted">{pos.parallel}</h2>
            {parallelRec.verses.map(({ v, t }) => (
              <span key={v} className="verse">
                <span className="vnum">{v}</span>{t}{' '}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="chapternav no-print">
        <button className="btn secondary" onClick={() => goChapter(-1)}>← Previous</button>
        <button className="btn secondary" onClick={() => goChapter(1)}>Next →</button>
      </div>

      {selected.length > 0 && !editing && (
        <div className="actionbar">
          <span className="small muted">v{selected[0]}{selected.length > 1 ? `–${selected[selected.length - 1]}` : ''}</span>
          {HIGHLIGHTS.map(h => (
            <button key={h.id} className="swatch" style={{ background: h.dot }}
              onClick={() => applyHighlight(h.id)} title={`Highlight ${h.id}`} />
          ))}
          <button className="btn small" onClick={() => setEditing('new')}>+ Note</button>
          <button className="btn secondary small" onClick={() => setSelected([])}>✕</button>
        </div>
      )}

      {editing && (
        <NoteEditor
          note={editing === 'new' ? undefined : editing}
          kind="verse"
          refs={selectionRefs()}
          onDone={() => { setEditing(null); setSelected([]) }}
        />
      )}
    </div>
  )
}
