import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, getChapter, notesInChapter, type VerseRef } from '../lib/db'
import { bookName } from '../lib/books'
import { useSelection } from '../lib/useSelection'
import { ordered, verseRange } from '../lib/selection'
import { lookup } from '../lib/strongs'
import VerseText from './VerseText'
import StrongsInfo from './StrongsInfo'
import CrossRefs from './CrossRefs'
import ContextPanel from './ContextPanel'
import { requestJump } from '../lib/nav'

interface Props {
  refs: VerseRef[]
  translation: string
  onTranslation: (id: string) => void
  /** Take the selected verses into the outline. */
  onCapture?: (ref: VerseRef, text: string) => void
  /** Take the original word behind the selected word into the notes. */
  onCaptureWord?: (line: string) => void
}

/**
 * The passage being preached on, open beside the notes: the text itself, the
 * historical background, cross references, and the original word behind any
 * word tapped — everything needed to check the context of a claim without
 * leaving the sermon note or losing your place.
 */
export default function PassageInspector({ refs, translation, onTranslation, onCapture, onCaptureWord }: Props) {
  const {
    sel, clear, onWord, onVerse, onDragOver, expandVerses, measure, label, isSingleWord
  } = useSelection()

  const translations = useLiveQuery(() => db.translations.toArray(), []) || []
  const key = refs.map(r => `${r.book}:${r.chapter}:${r.v1}-${r.v2}`).join(',')

  // The verses of every chapter the reference touches, in the chosen version.
  const blocks = useLiveQuery(async () => {
    const out: { ref: VerseRef; verses: { v: number; t: string; s?: Record<string, string[]> }[] }[] = []
    for (const r of refs) {
      const rec = translation ? await getChapter(translation, r.book, r.chapter) : undefined
      out.push({ ref: r, verses: (rec?.verses || []).filter(v => v.v >= r.v1 && v.v <= r.v2) })
    }
    return out
  }, [key, translation]) || []

  // Marks already on these chapters, so highlights made while reading show here too.
  const marks = useLiveQuery(async () => {
    const seen = new Set<string>()
    const out = []
    for (const r of refs) {
      const id = `${r.book}:${r.chapter}`
      if (seen.has(id)) continue
      seen.add(id)
      out.push(...(await notesInChapter(r.book, r.chapter)).filter(n => n.kind === 'mark'))
    }
    return out
  }, [key]) || []

  const selectedCodes = useMemo(() => {
    if (!sel || !isSingleWord) return []
    const block = blocks.find(b => b.ref.book === sel.book && b.ref.chapter === sel.chapter)
    const { start } = ordered(sel)
    return block?.verses.find(v => v.v === start.verse)?.s?.[String(start.word)] || []
  }, [sel, isSingleWord, blocks])

  const [wordBusy, setWordBusy] = useState(false)
  useEffect(() => { setWordBusy(false) }, [selectedCodes.join(',')])

  if (!refs.length) {
    return (
      <div className="card sermon-passage">
        <p className="muted small">Add a passage to read it here.</p>
      </div>
    )
  }

  /** The selected words, as text, for capturing a point. */
  function selectedText(): { ref: VerseRef; text: string } | null {
    if (!sel) return null
    const block = blocks.find(b => b.ref.book === sel.book && b.ref.chapter === sel.chapter)
    if (!block) return null
    const { start, end } = ordered(sel)
    const parts: string[] = []
    for (const v of block.verses) {
      if (v.v < start.verse || v.v > end.verse) continue
      const words = v.t.split(/\s+/)
      const from = !sel.whole && v.v === start.verse ? start.word : 0
      const to = !sel.whole && v.v === end.verse ? end.word : words.length - 1
      parts.push(words.slice(from, to + 1).join(' '))
    }
    return {
      ref: { book: sel.book, chapter: sel.chapter, v1: start.verse, v2: end.verse, translation },
      text: parts.join(' ')
    }
  }

  async function captureWord() {
    if (!onCaptureWord || !selectedCodes.length) return
    setWordBusy(true)
    const lines: string[] = []
    for (const code of selectedCodes) {
      const entry = await lookup(code)
      lines.push(entry
        ? `${code} ${entry.lemma}${entry.translit ? ` (${entry.translit})` : ''} — ${entry.definition}`
        : `${code} — not in the lexicon on this device yet`)
    }
    onCaptureWord(lines.join('\n'))
    setWordBusy(false)
    clear()
  }

  const selectedVerses = sel ? verseRange(sel) : []

  return (
    <div className="card sermon-passage">
      <div className="row" style={{ marginBottom: 6 }}>
        <select value={translation} onChange={e => onTranslation(e.target.value)} title="Version">
          {translations.length === 0 && <option value="">— no version —</option>}
          {translations.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button
          className="btn secondary small"
          onClick={() => requestJump({ translation, book: refs[0].book, chapter: refs[0].chapter, verse: refs[0].v1 })}
          title="Open this passage in the reader"
        >Open in reader</button>
      </div>

      <div className="reader sermon-text">
        {blocks.map(({ ref, verses }) => (
          <div key={`${ref.book}:${ref.chapter}`}>
            <h4 className="sermon-passage-head">
              {bookName(ref.book)} {ref.chapter}:{ref.v1}{ref.v2 !== ref.v1 ? `-${ref.v2}` : ''}
            </h4>
            {verses.length === 0 && (
              <p className="muted small">
                {translation ? `Not downloaded in ${translation}.` : 'Download a version to read the text here.'}
              </p>
            )}
            {verses.map(v => (
              <VerseText
                key={v.v} book={ref.book} chapter={ref.chapter} verse={v.v} text={v.t}
                marks={marks} sel={sel}
                onWord={onWord} onVerse={onVerse} onDragOver={onDragOver} onMeasure={measure}
              />
            ))}
          </div>
        ))}
      </div>

      {sel && (
        <div className="row sermon-selbar">
          <span className="small muted">{label}</span>
          <button className="btn secondary small" onClick={expandVerses}>⇱ Verse</button>
          {onCapture && (
            <button
              className="btn small"
              onClick={() => { const s = selectedText(); if (s) { onCapture(s.ref, s.text); clear() } }}
              title="Add this as a point in the outline"
            >+ Point</button>
          )}
          {onCaptureWord && selectedCodes.length > 0 && (
            <button className="btn small" disabled={wordBusy} onClick={captureWord} title="Keep the original word">
              {wordBusy ? 'Adding…' : `+ ${selectedCodes.join(', ')}`}
            </button>
          )}
          <button className="btn secondary small" onClick={clear} aria-label="Close">✕</button>
        </div>
      )}


      <ContextPanel book={refs[0].book} />
      {selectedCodes.length > 0 && <StrongsInfo codes={selectedCodes} translation={translation} />}
      {sel && selectedVerses.slice(0, 3).map(v => (
        <CrossRefs key={v} book={sel.book} chapter={sel.chapter} verse={v} translation={translation} />
      ))}
    </div>
  )
}
