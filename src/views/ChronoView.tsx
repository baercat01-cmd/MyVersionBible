import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, notesInChapter, saveMark, eraseMarks, type MarkStyle, type NoteRec, type VerseRef } from '../lib/db'
import { CHRONOLOGY, ERAS } from '../data/chronology'
import { HARMONY } from '../data/harmony'
import type { Segment } from '../data/types'
import { parsePassages, loadPassages, passagesLabel, type LoadedChapter } from '../lib/passages'
import { bookName } from '../lib/books'
import { MARK_COLORS, MARK_STYLES, colorHex } from '../lib/marks'
import { buildPlan, getCompleted, toggleCompleted, getStartDate, startPlan, resetPlan, dayForDate } from '../lib/plan'
import { paragraphs } from '../lib/storybooks'
import VerseText, { type Selection } from '../components/VerseText'
import NoteEditor from '../components/NoteEditor'

// 'book:<id>' selects an imported narrative retelling.
type Order = 'chronological' | 'harmony' | string
const BOOK_PREFIX = 'book:'
const IDX_KEY = 'mvb-chrono-index'
const ORDER_KEY = 'mvb-chrono-order'
const STORY_KEY = 'mvb-story-view'
const COLOR_KEY = 'mvb-mark-color'

export default function ChronoView() {
  const [order, setOrder] = useState<Order>(
    () => (localStorage.getItem(ORDER_KEY) as Order) || 'chronological')
  const [index, setIndex] = useState(() => +(localStorage.getItem(IDX_KEY) || 0))
  const [story, setStory] = useState(() => localStorage.getItem(STORY_KEY) === '1')
  const [color, setColor] = useState(() => localStorage.getItem(COLOR_KEY) || 'yellow')
  const [sel, setSel] = useState<Selection | null>(null)
  const [editing, setEditing] = useState<NoteRec | 'new' | null>(null)
  const [loaded, setLoaded] = useState<LoadedChapter[] | null>(null)
  const [showPlan, setShowPlan] = useState(false)

  const translations = useLiveQuery(() => db.translations.toArray(), []) || []
  const storyBooks = useLiveQuery(() => db.storybooks.toArray(), []) || []
  const activeBook = order.startsWith(BOOK_PREFIX)
    ? storyBooks.find(b => b.id === order.slice(BOOK_PREFIX.length))
    : undefined
  const [translation, setTranslation] = useState('')
  useEffect(() => {
    if (translations.length && !translations.find(t => t.id === translation)) {
      setTranslation(translations[0].id)
    }
  }, [translations.length])

  const segments = order === 'harmony' ? HARMONY : CHRONOLOGY
  const bookChapter = activeBook
    ? activeBook.chapters[Math.min(Math.max(index, 0), activeBook.chapters.length - 1)]
    : undefined
  const clamped = Math.min(Math.max(index, 0), segments.length - 1)
  const segment: Segment | undefined = segments[clamped]

  useEffect(() => { localStorage.setItem(IDX_KEY, String(clamped)) }, [clamped])
  useEffect(() => { localStorage.setItem(ORDER_KEY, order) }, [order])
  useEffect(() => { localStorage.setItem(STORY_KEY, story ? '1' : '0') }, [story])
  useEffect(() => { localStorage.setItem(COLOR_KEY, color) }, [color])
  useEffect(() => { setSel(null) }, [clamped, order, translation])

  // Nothing to apply an order to: go straight to the retelling.
  useEffect(() => {
    if (!translations.length && storyBooks.length && !order.startsWith(BOOK_PREFIX)) {
      setOrder(BOOK_PREFIX + storyBooks[0].id)
      setIndex(0)
    }
  }, [translations.length, storyBooks.length, order])

  // Load the segment's passages from the chosen translation.
  useEffect(() => {
    let live = true
    if (!segment || !translation) { setLoaded(null); return }
    setLoaded(null)
    ;(async () => {
      const chapters = await loadPassages(translation, parsePassages(segment.refs))
      if (live) setLoaded(chapters)
    })()
    return () => { live = false }
  }, [segment?.id, translation])

  // Marks and notes for every chapter this segment touches.
  const chaptersTouched = useMemo(
    () => [...new Set((loaded || []).map(c => `${c.book}:${c.chapter}`))],
    [loaded]
  )
  const anchored = useLiveQuery(async () => {
    const all: NoteRec[] = []
    for (const key of chaptersTouched) {
      const [b, c] = key.split(':').map(Number)
      all.push(...await notesInChapter(b, c))
    }
    return all
  }, [chaptersTouched.join('|')]) || []
  const marks = useMemo(() => anchored.filter(n => n.kind === 'mark'), [anchored])

  // Reading plan
  const plan = useMemo(() => buildPlan(365), [])
  const [completed, setCompletedState] = useState<Set<string>>(new Set())
  const [planStart, setPlanStart] = useState<string | null>(null)
  useEffect(() => { getCompleted().then(setCompletedState); getStartDate().then(setPlanStart) }, [])

  const eraOf = ERAS.find(e => e.id === segment?.era)

  // A segment can span several chapters, so every selection carries its own
  // book and chapter rather than relying on a verse number alone.
  function selectWord(book: number, chapter: number, verse: number, wordIndex: number) {
    setSel(prev => {
      const same = prev && prev.book === book && prev.chapter === chapter && prev.verse === verse
      if (!same || !prev!.words.length) return { book, chapter, verse, words: [wordIndex] }
      const words = prev!.words.includes(wordIndex)
        ? prev!.words.filter(w => w !== wordIndex)
        : [...prev!.words, wordIndex].sort((a, b) => a - b)
      return words.length ? { book, chapter, verse, words } : null
    })
  }

  function selectVerse(book: number, chapter: number, verse: number) {
    setSel(prev => (prev && prev.book === book && prev.chapter === chapter
      && prev.verse === verse && !prev.words.length)
      ? null
      : { book, chapter, verse, words: [] })
  }

  function selectionRef(): VerseRef {
    return {
      book: sel!.book, chapter: sel!.chapter,
      v1: sel!.verse, v2: sel!.verse, translation
    }
  }

  async function applyMark(style: MarkStyle) {
    if (!sel) return
    await saveMark(selectionRef(), style, color, sel.words.length ? sel.words : null)
    setSel(null)
  }

  async function erase() {
    if (!sel) return
    await eraseMarks(sel.book, sel.chapter, sel.verse, sel.words)
    setSel(null)
  }

  // A retelling needs no translation, so only block when there is nothing to read.
  if (!translations.length && !storyBooks.length) {
    return (
      <div className="card">
        <h3>Nothing to read yet</h3>
        <p>
          The chronological order applies to whichever translations you have on this
          device. Open the <strong>Versions</strong> tab to download one — or import a
          narrative retelling there to read on its own.
        </p>
      </div>
    )
  }

  if (showPlan) {
    const today = planStart ? Math.min(dayForDate(planStart), 365) : null
    return (
      <div className="stack">
        <div className="row">
          <button className="btn secondary small" onClick={() => setShowPlan(false)}>← Back to reading</button>
          {planStart
            ? <button className="btn secondary small" onClick={async () => { await resetPlan(); setPlanStart(null); setCompletedState(new Set()) }}>Reset plan</button>
            : <button className="btn small" onClick={async () => setPlanStart(await startPlan())}>Start today</button>}
        </div>
        <div className="card">
          <h3>Through the Bible in a year</h3>
          <p className="muted small">
            All {CHRONOLOGY.length} segments in chronological order, spread over 365 days by length
            of reading. {planStart
              ? <>Started {planStart} — you are on <strong>day {today}</strong>.</>
              : <>Not started. You can also just read straight through without dates.</>}
            {' '}{completed.size} of {CHRONOLOGY.length} segments read.
          </p>
        </div>
        {plan.map(d => {
          const isToday = today === d.day
          const allDone = d.segments.every(s => completed.has(s.id))
          return (
            <div className={`card planday ${isToday ? 'today' : ''} ${allDone ? 'done' : ''}`} key={d.day}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>Day {d.day}{isToday ? ' · today' : ''}</strong>
                {allDone && <span className="small muted">✓ read</span>}
              </div>
              {d.segments.map(s => (
                <div className="row planseg" key={s.id}>
                  <input
                    type="checkbox"
                    checked={completed.has(s.id)}
                    onChange={async () => setCompletedState(await toggleCompleted(s.id))}
                  />
                  <button className="linklike" onClick={() => {
                    const i = segments.findIndex(x => x.id === s.id)
                    if (i >= 0) { setIndex(i); setShowPlan(false); window.scrollTo(0, 0) }
                  }}>
                    {s.title}
                  </button>
                  <span className="meta">{s.refs.length ? passagesLabel(parsePassages(s.refs)) : '—'}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      <div className="row no-print" style={{ marginBottom: 10 }}>
        {translations.length > 0 && (
          <select value={translation} onChange={e => setTranslation(e.target.value)}>
            {translations.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
          </select>
        )}
        <select value={order} onChange={e => { setOrder(e.target.value as Order); setIndex(0) }}>
          {translations.length > 0 && <option value="chronological">Whole Bible in order</option>}
          {translations.length > 0 && <option value="harmony">Life of Christ (gospel harmony)</option>}
          {storyBooks.map(b => (
            <option key={b.id} value={BOOK_PREFIX + b.id}>{b.title} (retelling)</option>
          ))}
        </select>
        {!activeBook && <select value={segment?.era || ''} onChange={e => {
          const i = segments.findIndex(s => s.era === e.target.value)
          if (i >= 0) { setIndex(i); window.scrollTo(0, 0) }
        }}>
          {ERAS.filter(era => segments.some(s => s.era === era.id))
            .map(era => <option key={era.id} value={era.id}>{era.title}</option>)}
        </select>}
        {!activeBook && (
          <>
            <button className={`btn small ${story ? '' : 'secondary'}`} onClick={() => setStory(s => !s)}>
              {story ? '📖 Story view' : '📑 Verse view'}
            </button>
            <button className="btn secondary small" onClick={() => setShowPlan(true)}>🗓 Plan</button>
          </>
        )}
      </div>

      {activeBook && bookChapter && (
        <div className="reader chrono storyview">
          <div className="segment-head">
            <div className="era-label">{activeBook.title}{activeBook.author ? ` · ${activeBook.author}` : ''}</div>
            <h2>{bookChapter.title}</h2>
            <div className="muted small">
              chapter {bookChapter.n} of {activeBook.chapters.length} · a retelling, not scripture
            </div>
          </div>
          {paragraphs(bookChapter.text).map((para, i) => <p key={i} className="story-para">{para}</p>)}
          <div className="chapternav no-print">
            <button className="btn secondary" disabled={index <= 0}
              onClick={() => { setIndex(index - 1); window.scrollTo(0, 0) }}>← Previous</button>
            <button className="btn secondary" disabled={index >= activeBook.chapters.length - 1}
              onClick={() => { setIndex(index + 1); window.scrollTo(0, 0) }}>Next →</button>
          </div>
        </div>
      )}

      {!activeBook && segment && (
        <div className={`reader chrono ${story ? 'storyview' : ''}`}>
          <div className="segment-head">
            {eraOf && <div className="era-label">{eraOf.title} · {eraOf.subtitle}</div>}
            <h2>{segment.title}</h2>
            <div className="muted small">
              {segment.refs.length ? passagesLabel(parsePassages(segment.refs)) : 'No scripture in this period'}
              {' · '}{translation}
              {' · '}segment {clamped + 1} of {segments.length}
            </div>
            {segment.note && <p className="placement-note">ⓘ {segment.note}</p>}
          </div>

          {segment.refs.length > 0 && loaded === null && <p className="muted">Loading…</p>}
          {loaded !== null && loaded.length === 0 && segment.refs.length > 0 && (
            <p className="muted">
              This passage is not in {translation}. Try another version — the Hebrew and Greek
              texts only cover their own testament.
            </p>
          )}

          {(loaded || []).map(ch => (
            <div key={`${ch.book}:${ch.chapter}`} className="chrono-chapter">
              <h3 className="chapter-label">{bookName(ch.book)} {ch.chapter}</h3>
              <div className={story ? 'prose' : ''}>
                {ch.verses.map(({ v, t }) => (
                  <VerseText
                    key={v} verse={v} text={t} marks={marks}
                    book={ch.book} chapter={ch.chapter}
                    sel={sel} story={story}
                    onWord={selectWord} onVerse={selectVerse}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="chapternav no-print">
            <button className="btn secondary" disabled={clamped === 0}
              onClick={() => { setIndex(clamped - 1); window.scrollTo(0, 0) }}>← Previous</button>
            <button
              className="btn secondary"
              onClick={async () => { setCompletedState(await toggleCompleted(segment.id)) }}
              title="Mark this segment read"
            >{completed.has(segment.id) ? '✓ Read' : 'Mark read'}</button>
            <button className="btn secondary" disabled={clamped >= segments.length - 1}
              onClick={() => { setIndex(clamped + 1); window.scrollTo(0, 0) }}>Next →</button>
          </div>
        </div>
      )}

      {sel && !editing && (
        <div className="actionbar no-print">
          <span className="small muted" style={{ minWidth: 54 }}>
            v{sel.verse}{sel.words.length ? ` · ${sel.words.length}w` : ''}
          </span>
          <div className="row" style={{ gap: 4 }}>
            {MARK_COLORS.map(c => (
              <button key={c.id} className={`swatch ${color === c.id ? 'active' : ''}`}
                style={{ background: c.hex }} onClick={() => setColor(c.id)}
                title={c.label} aria-label={c.label} />
            ))}
          </div>
          <div className="row" style={{ gap: 4 }}>
            {MARK_STYLES.map(s => (
              <button key={s.id} className="btn small markbtn" style={{ borderColor: colorHex(color) }}
                onClick={() => applyMark(s.id)} title={s.label}>{s.glyph}</button>
            ))}
          </div>
          <button className="btn secondary small" onClick={erase}>Erase</button>
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
