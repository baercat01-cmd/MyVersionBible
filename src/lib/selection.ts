/**
 * A selection in the reader: a range running from an anchor to a focus point,
 * which may cover part of a word run, a phrase crossing verses, whole verses,
 * or an entire chapter.
 *
 * Points are (verse, word index) pairs. `whole` marks a verse-level selection,
 * where the word indices are ignored and every word of every verse in the range
 * is included.
 */
export interface SelPoint { verse: number; word: number }

export interface Selection {
  book: number
  chapter: number
  anchor: SelPoint
  focus: SelPoint
  whole: boolean
}

function before(a: SelPoint, b: SelPoint): boolean {
  return a.verse < b.verse || (a.verse === b.verse && a.word <= b.word)
}

/** The selection with its ends in reading order. */
export function ordered(sel: Selection): { start: SelPoint; end: SelPoint } {
  return before(sel.anchor, sel.focus)
    ? { start: sel.anchor, end: sel.focus }
    : { start: sel.focus, end: sel.anchor }
}

export function firstVerse(sel: Selection): number { return ordered(sel).start.verse }
export function lastVerse(sel: Selection): number { return ordered(sel).end.verse }

export function verseRange(sel: Selection): number[] {
  const { start, end } = ordered(sel)
  const out: number[] = []
  for (let v = start.verse; v <= end.verse; v++) out.push(v)
  return out
}

export function isWordSelected(sel: Selection | null, book: number, chapter: number, verse: number, word: number): boolean {
  if (!sel || sel.book !== book || sel.chapter !== chapter) return false
  const { start, end } = ordered(sel)
  if (verse < start.verse || verse > end.verse) return false
  if (sel.whole) return true
  if (verse > start.verse && verse < end.verse) return true
  if (verse === start.verse && verse === end.verse) return word >= start.word && word <= end.word
  if (verse === start.verse) return word >= start.word
  return word <= end.word
}

/**
 * Which words of one verse the selection covers: an explicit list, or null when
 * the whole verse is covered (the compact form marks are stored in).
 */
export function wordsForVerse(sel: Selection, verse: number, wordCount: number): number[] | null {
  const { start, end } = ordered(sel)
  if (verse < start.verse || verse > end.verse) return []
  if (sel.whole) return null
  if (verse > start.verse && verse < end.verse) return null
  const from = verse === start.verse ? start.word : 0
  const to = verse === end.verse ? end.word : wordCount - 1
  if (from <= 0 && to >= wordCount - 1) return null
  const out: number[] = []
  for (let i = Math.max(0, from); i <= Math.min(to, wordCount - 1); i++) out.push(i)
  return out
}

export function isSingleWord(sel: Selection | null): boolean {
  if (!sel || sel.whole) return false
  const { start, end } = ordered(sel)
  return start.verse === end.verse && start.word === end.word
}

/** A short description for the toolbar, e.g. "v3:2-v5" or "vv 3-5". */
export function describe(sel: Selection | null, wordCounts?: Map<number, number>): string {
  if (!sel) return ''
  const { start, end } = ordered(sel)
  if (sel.whole) {
    return start.verse === end.verse ? `v${start.verse}` : `vv ${start.verse}-${end.verse}`
  }
  if (start.verse === end.verse) {
    const n = end.word - start.word + 1
    const total = wordCounts?.get(start.verse)
    if (total && n >= total) return `v${start.verse}`
    return `v${start.verse} · ${n}w`
  }
  return `v${start.verse}-${end.verse}`
}

export function pointOf(verse: number, word: number): SelPoint { return { verse, word } }

/** Collapse to a single word — the starting point of a fresh selection. */
export function atWord(book: number, chapter: number, verse: number, word: number): Selection {
  return { book, chapter, anchor: { verse, word }, focus: { verse, word }, whole: false }
}

export function atVerse(book: number, chapter: number, verse: number): Selection {
  return { book, chapter, anchor: { verse, word: 0 }, focus: { verse, word: 0 }, whole: true }
}

export function spanVerses(book: number, chapter: number, from: number, to: number): Selection {
  return { book, chapter, anchor: { verse: from, word: 0 }, focus: { verse: to, word: 0 }, whole: true }
}

/** Extend an existing selection to reach a new point, keeping the anchor. */
export function extendTo(sel: Selection, verse: number, word: number, whole = sel.whole): Selection {
  return { ...sel, focus: { verse, word }, whole }
}

/** Grow a word selection out to cover every verse it touches. */
export function expandToVerses(sel: Selection): Selection {
  const { start, end } = ordered(sel)
  return spanVerses(sel.book, sel.chapter, start.verse, end.verse)
}
