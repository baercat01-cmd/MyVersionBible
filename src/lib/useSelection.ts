import { useCallback, useRef, useState } from 'react'
import type { VerseRef } from './db'
import {
  atWord, atVerse, spanVerses, extendTo, expandToVerses, ordered,
  wordsForVerse, verseRange, describe, isSingleWord, type Selection
} from './selection'

/**
 * Selection behaviour shared by both readers.
 *
 * Tapping a word with nothing selected starts there. Tapping another word
 * extends the range from the original anchor, so a phrase — across verses if
 * need be — takes two taps. Dragging selects directly. Verse numbers work the
 * same way at verse level, and the toolbar can widen a selection to whole
 * verses or the entire chapter.
 */
export function useSelection() {
  const [sel, setSel] = useState<Selection | null>(null)
  // Word counts per verse, reported by the renderer, so the toolbar can tell a
  // full verse from a phrase and marks can cover "the rest of this verse".
  const wordCounts = useRef(new Map<number, number>())

  const measure = useCallback((verse: number, count: number) => {
    wordCounts.current.set(verse, count)
  }, [])

  const clear = useCallback(() => setSel(null), [])

  const onWord = useCallback((book: number, chapter: number, verse: number, i: number) => {
    setSel(prev => {
      if (!prev || prev.book !== book || prev.chapter !== chapter) {
        return atWord(book, chapter, verse, i)
      }
      // Tapping the single selected word again clears it.
      if (isSingleWord(prev) && prev.anchor.verse === verse && prev.anchor.word === i) return null
      return extendTo(prev, verse, i, false)
    })
  }, [])

  const onVerse = useCallback((book: number, chapter: number, verse: number) => {
    setSel(prev => {
      if (!prev || prev.book !== book || prev.chapter !== chapter) {
        return atVerse(book, chapter, verse)
      }
      const { start, end } = ordered(prev)
      // Tapping the number of an already whole-selected single verse clears it.
      if (prev.whole && start.verse === verse && end.verse === verse) return null
      return extendTo(prev, verse, 0, true)
    })
  }, [])

  const onDragOver = useCallback((book: number, chapter: number, verse: number, i: number) => {
    setSel(prev => (prev && prev.book === book && prev.chapter === chapter)
      ? extendTo(prev, verse, i, prev.whole)
      : prev)
  }, [])

  const expandVerses = useCallback(() => {
    setSel(prev => (prev ? expandToVerses(prev) : prev))
  }, [])

  const selectChapter = useCallback((book: number, chapter: number, first: number, last: number) => {
    setSel(spanVerses(book, chapter, first, last))
  }, [])

  /** The selection as one reference, for notes, studies and collections. */
  const selectionRef = useCallback((translation: string): VerseRef | null => {
    if (!sel) return null
    const { start, end } = ordered(sel)
    return { book: sel.book, chapter: sel.chapter, v1: start.verse, v2: end.verse, translation }
  }, [sel])

  /** Per-verse word lists, for applying or erasing marks across the range. */
  const perVerse = useCallback((): { verse: number; words: number[] | null }[] => {
    if (!sel) return []
    return verseRange(sel).map(v => ({
      verse: v,
      words: wordsForVerse(sel, v, wordCounts.current.get(v) ?? 0)
    }))
  }, [sel])

  const label = describe(sel, wordCounts.current)

  return {
    sel, setSel, clear, onWord, onVerse, onDragOver,
    expandVerses, selectChapter, selectionRef, perVerse, measure, label,
    isSingleWord: isSingleWord(sel)
  }
}
