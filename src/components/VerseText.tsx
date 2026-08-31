import { Fragment, useMemo } from 'react'
import type { NoteRec } from '../lib/db'
import { tokenize, marksForVerse, markStyle } from '../lib/marks'

/** A verse selection: one verse, either whole (words empty) or specific words. */
export interface Selection { book: number; chapter: number; verse: number; words: number[] }

interface Props {
  book: number
  chapter: number
  verse: number
  text: string
  marks: NoteRec[]
  sel: Selection | null
  /** Story view drops the verse number and lets the text run as prose. */
  story?: boolean
  onWord: (book: number, chapter: number, verse: number, i: number) => void
  onVerse: (book: number, chapter: number, verse: number) => void
}

/**
 * One verse, split into individually markable words. Shared by the normal
 * reader and the chronological reader so marking behaves identically in both.
 */
export default function VerseText({
  book, chapter, verse, text, marks, sel, story, onWord, onVerse
}: Props) {
  const words = useMemo(() => tokenize(text), [text])
  const applied = useMemo(
    () => marksForVerse(marks, book, chapter, verse, words.length),
    [marks, book, chapter, verse, words.length]
  )
  const here = sel && sel.book === book && sel.chapter === chapter && sel.verse === verse
  const verseSelected = !!here && !sel!.words.length

  return (
    <span className={`verse ${verseSelected ? 'selected' : ''}`}>
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
        const wordSelected = !!here && sel!.words.includes(i)
        return (
          <Fragment key={i}>
            {i > 0 && ' '}
            <span
              className={`word ${wordSelected ? 'wsel' : ''}`}
              style={markStyle(applied.get(i))}
              onClick={() => onWord(book, chapter, verse, i)}
            >{w}</span>
          </Fragment>
        )
      })}
      {' '}
    </span>
  )
}
