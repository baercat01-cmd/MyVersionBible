import { Fragment, useEffect, useMemo } from 'react'
import type { NoteRec } from '../lib/db'
import { tokenize, marksForVerse, markStyle } from '../lib/marks'
import { isWordSelected, type Selection } from '../lib/selection'

export type { Selection }

interface Props {
  book: number
  chapter: number
  verse: number
  text: string
  marks: NoteRec[]
  sel: Selection | null
  /** Story view drops the verse number and lets the text run as prose. */
  story?: boolean
  /** Briefly highlighted after jumping here from search or a cross reference. */
  flash?: boolean
  /** Currently being read aloud. */
  speaking?: boolean
  onWord: (book: number, chapter: number, verse: number, i: number) => void
  onVerse: (book: number, chapter: number, verse: number) => void
  /** Pointer dragged across a word — extends the range without starting a new one. */
  onDragOver?: (book: number, chapter: number, verse: number, i: number) => void
  /** Report the word count so the toolbar can tell a full verse from a phrase. */
  onMeasure?: (verse: number, wordCount: number) => void
}

/**
 * One verse, split into individually markable words. Shared by the normal
 * reader and the chronological reader so marking behaves identically in both.
 */
export default function VerseText({
  book, chapter, verse, text, marks, sel, story, flash, speaking,
  onWord, onVerse, onDragOver, onMeasure
}: Props) {
  const words = useMemo(() => tokenize(text), [text])
  const applied = useMemo(
    () => marksForVerse(marks, book, chapter, verse, words.length),
    [marks, book, chapter, verse, words.length]
  )
  useEffect(() => { onMeasure?.(verse, words.length) }, [verse, words.length])

  return (
    <span
      className={`verse ${flash ? 'flash' : ''} ${speaking ? 'speaking' : ''}`}
      data-verse={`${book}-${chapter}-${verse}`}
    >
      {!story && (
        <span className="vnum" onClick={() => onVerse(book, chapter, verse)} title="Select the whole verse">
          {verse}
        </span>
      )}
      {story && (
        // Story view still needs a way to grab the whole verse; the gap before
        // the first word acts as the handle.
        <span className="vhandle" onClick={() => onVerse(book, chapter, verse)} title={`Verse ${verse}`} />
      )}
      {words.map((w, i) => {
        const wordSelected = isWordSelected(sel, book, chapter, verse, i)
        return (
          <Fragment key={i}>
            {i > 0 && ' '}
            <span
              className={`word ${wordSelected ? 'wsel' : ''}`}
              style={markStyle(applied.get(i))}
              onClick={() => onWord(book, chapter, verse, i)}
              onPointerEnter={e => { if (e.buttons === 1) onDragOver?.(book, chapter, verse, i) }}
            >{w}</span>
          </Fragment>
        )
      })}
      {' '}
    </span>
  )
}
