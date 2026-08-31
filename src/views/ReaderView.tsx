import { Fragment, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  db, getChapter, notesInChapter, saveMark, eraseMarks,
  type MarkStyle, type NoteRec, type VerseRef
} from '../lib/db'
import { bookName } from '../lib/books'
import { MARK_COLORS, MARK_STYLES, colorHex, tokenize, marksForVerse, markStyle } from '../lib/marks'
import NoteEditor from '../components/NoteEditor'
import NotesPanel from '../components/NotesPanel'

interface Position { translation: string; book: number; chapter: number; parallel: string }

const POS_KEY = 'mvb-position'
const COLOR_KEY = 'mvb-mark-color'
const PANEL_KEY = 'mvb-notes-panel'

function loadPos(): Position {
  try {
    const p = JSON.parse(localStorage.getItem(POS_KEY) || '')
    if (p && p.translation) return { parallel: '', ...p }
  } catch { /* fresh start */ }
  return { translation: '', book: 43, chapter: 1, parallel: '' }
}

/** A selection is one verse, either whole (words empty) or specific words. */
interface Selection { verse: number; words: number[] }

export default function ReaderView() {
  const [pos, setPos] = useState<Position>(loadPos)
  const [sel, setSel] = useState<Selection | null>(null)
  const [editing, setEditing] = useState<NoteRec | 'new' | null>(null)
  const [color, setColor] = useState(() => localStorage.getItem(COLOR_KEY) || 'yellow')
  const [showPanel, setShowPanel] = useState(() => localStorage.getItem(PANEL_KEY) !== '0')

  const translations = useLiveQuery(() => db.translations.toArray(), []) || []

  useEffect(() => {
    if (translations.length && !translations.find(t => t.id === pos.translation)) {
      setPos(p => ({ ...p, translation: translations[0].id }))
    }
  }, [translations.length])

  useEffect(() => { localStorage.setItem(POS_KEY, JSON.stringify(pos)) }, [pos])
  useEffect(() => { localStorage.setItem(COLOR_KEY, color) }, [color])
  useEffect(() => { localStorage.setItem(PANEL_KEY, showPanel ? '1' : '0') }, [showPanel])
  useEffect(() => { setSel(null) }, [pos.translation, pos.book, pos.chapter])

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

  // Everything anchored in this chapter — marks and notes alike. Live, so a new
  // mark or note appears immediately and is still here on the next visit.
  const anchored = useLiveQuery(
    () => notesInChapter(pos.book, pos.chapter),
    [pos.book, pos.chapter]
  ) || []

  const marks = useMemo(() => anchored.filter(n => n.kind === 'mark'), [anchored])
  const chapterNotes = useMemo(
    () => anchored.filter(n => n.kind !== 'mark')
      .sort((a, b) => (verseOf(a) - verseOf(b)) || a.created_at.localeCompare(b.created_at)),
    [anchored]
  )

  function verseOf(n: NoteRec): number {
    const r = n.refs.find(x => x.book === pos.book && x.chapter === pos.chapter)
    return r ? r.v1 : 0
  }

  function selectWord(verse: number, wordIndex: number) {
    setSel(prev => {
      if (!prev || prev.verse !== verse) return { verse, words: [wordIndex] }
      if (!prev.words.length) return { verse, words: [wordIndex] }   // was whole-verse
      const words = prev.words.includes(wordIndex)
        ? prev.words.filter(w => w !== wordIndex)
        : [...prev.words, wordIndex].sort((a, b) => a - b)
      return words.length ? { verse, words } : null
    })
  }

  function selectVerse(verse: number) {
    setSel(prev => (prev && prev.verse === verse && !prev.words.length) ? null : { verse, words: [] })
  }

  function selectionRef(): VerseRef {
    const v = sel?.verse ?? 1
    return { book: pos.book, chapter: pos.chapter, v1: v, v2: v, translation: pos.translation }
  }

  async function applyMark(style: MarkStyle) {
    if (!sel) return
    await saveMark(selectionRef(), style, color, sel.words.length ? sel.words : null)
    setSel(null)
  }

  async function erase() {
    if (!sel) return
    await eraseMarks(pos.book, pos.chapter, sel.verse, sel.words)
    setSel(null)
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
  const noteCount = chapterNotes.length

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
        <button
          className={`btn small ${showPanel ? '' : 'secondary'}`}
          onClick={() => setShowPanel(s => !s)}
          title="Show notes beside the text"
        >
          📝 Notes{noteCount ? ` (${noteCount})` : ''}
        </button>
      </div>

      <div className={`readerwrap ${showPanel ? 'with-panel' : ''}`}>
        <div className="readercol">
          <div className={`reader ${parallelRec ? 'parallel' : ''}`}>
            <div className={isRTL ? 'rtl' : ''}>
              <h2>{bookName(pos.book, bookMeta?.name)} {pos.chapter} <span className="muted small">({pos.translation})</span></h2>
              {!chapterRec && <p className="muted">Chapter not found in this version.</p>}
              {chapterRec?.verses.map(({ v, t }) => (
                <Verse
                  key={v} verse={v} text={t} marks={marks}
                  book={pos.book} chapter={pos.chapter}
                  sel={sel} onWord={selectWord} onVerse={selectVerse}
                />
              ))}
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
        </div>

        {showPanel && (
          <NotesPanel
            notes={chapterNotes}
            reference={`${bookName(pos.book, bookMeta?.name)} ${pos.chapter}`}
            onOpen={n => setEditing(n)}
            onNew={() => setEditing('new')}
            canAdd={!!sel}
          />
        )}
      </div>

      {sel && !editing && (
        <div className="actionbar no-print">
          <span className="small muted" style={{ minWidth: 54 }}>
            v{sel.verse}{sel.words.length ? ` · ${sel.words.length}w` : ''}
          </span>
          <div className="row" style={{ gap: 4 }}>
            {MARK_COLORS.map(c => (
              <button
                key={c.id}
                className={`swatch ${color === c.id ? 'active' : ''}`}
                style={{ background: c.hex }}
                onClick={() => setColor(c.id)}
                title={c.label}
                aria-label={c.label}
              />
            ))}
          </div>
          <div className="row" style={{ gap: 4 }}>
            {MARK_STYLES.map(s => (
              <button
                key={s.id}
                className="btn small markbtn"
                style={{ borderColor: colorHex(color) }}
                onClick={() => applyMark(s.id)}
                title={s.label}
              >{s.glyph}</button>
            ))}
          </div>
          <button className="btn secondary small" onClick={erase} title="Erase marks here">Erase</button>
          <button className="btn small" onClick={() => setEditing('new')}>+ Note</button>
          <button className="btn secondary small" onClick={() => setSel(null)} aria-label="Close">✕</button>
        </div>
      )}

      {editing && (
        <div className="editor-overlay">
          <NoteEditor
            note={editing === 'new' ? undefined : editing}
            kind={editing === 'new' ? 'verse' : editing.kind}
            refs={editing === 'new' && sel ? [selectionRef()] : undefined}
            onDone={() => { setEditing(null); setSel(null) }}
          />
        </div>
      )}
    </div>
  )
}

function Verse({ verse, text, marks, book, chapter, sel, onWord, onVerse }: {
  verse: number
  text: string
  marks: NoteRec[]
  book: number
  chapter: number
  sel: Selection | null
  onWord: (verse: number, i: number) => void
  onVerse: (verse: number) => void
}) {
  const words = useMemo(() => tokenize(text), [text])
  const applied = useMemo(
    () => marksForVerse(marks, book, chapter, verse, words.length),
    [marks, book, chapter, verse, words.length]
  )
  const verseSelected = sel?.verse === verse && !sel.words.length

  return (
    <span className={`verse ${verseSelected ? 'selected' : ''}`}>
      <span className="vnum" onClick={() => onVerse(verse)} title="Select the whole verse">{verse}</span>
      {words.map((w, i) => {
        const wordSelected = sel?.verse === verse && sel.words.includes(i)
        return (
          <Fragment key={i}>
            {i > 0 && ' '}
            <span
              className={`word ${wordSelected ? 'wsel' : ''}`}
              style={markStyle(applied.get(i))}
              onClick={() => onWord(verse, i)}
            >{w}</span>
          </Fragment>
        )
      })}
      {' '}
    </span>
  )
}
