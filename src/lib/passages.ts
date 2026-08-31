import { db, chapterKey } from './db'
import { BOOK_NAMES } from './books'

/** A passage: book, start chapter/verse, end chapter/verse. */
export interface Passage {
  book: number
  c1: number
  v1: number | null   // null = from the start of the chapter
  c2: number
  v2: number | null   // null = to the end of the chapter
}

// Abbreviations used when authoring the chronological and harmony data.
const ABBREV: Record<string, number> = {
  gen: 1, exo: 2, lev: 3, num: 4, deu: 5, jos: 6, jdg: 7, rut: 8,
  '1sa': 9, '2sa': 10, '1ki': 11, '2ki': 12, '1ch': 13, '2ch': 14,
  ezr: 15, neh: 16, est: 17, job: 18, psa: 19, pro: 20, ecc: 21, sng: 22,
  isa: 23, jer: 24, lam: 25, ezk: 26, dan: 27, hos: 28, jol: 29, amo: 30,
  oba: 31, jon: 32, mic: 33, nam: 34, hab: 35, zep: 36, hag: 37, zec: 38, mal: 39,
  mat: 40, mrk: 41, luk: 42, jhn: 43, act: 44, rom: 45,
  '1co': 46, '2co': 47, gal: 48, eph: 49, php: 50, col: 51,
  '1th': 52, '2th': 53, '1ti': 54, '2ti': 55, tit: 56, phm: 57,
  heb: 58, jas: 59, '1pe': 60, '2pe': 61, '1jn': 62, '2jn': 63, '3jn': 64,
  jud: 65, rev: 66
}

/**
 * Parse a reference written in the compact authoring form, e.g.
 *   "Gen 1"          whole chapter
 *   "Gen 1-3"        chapter range
 *   "Gen 3:1-24"     verse range in one chapter
 *   "Gen 1:1-2:3"    spanning chapters
 *   "Psa 23:1"       a single verse
 */
export function parsePassage(ref: string): Passage {
  const m = ref.trim().match(/^([1-3]?[A-Za-z]+)\s+(\d+)(?::(\d+))?(?:\s*-\s*(?:(\d+):)?(\d+))?$/)
  if (!m) throw new Error(`Unparseable reference: ${ref}`)
  const [, bookRaw, c1s, v1s, c2s, endS] = m
  const book = ABBREV[bookRaw.toLowerCase()]
  if (!book) throw new Error(`Unknown book in reference: ${ref}`)

  const c1 = +c1s
  const v1 = v1s ? +v1s : null

  // With no end part at all the passage is just the start chapter/verse.
  if (!endS) return { book, c1, v1, c2: c1, v2: v1 }

  if (c2s) return { book, c1, v1, c2: +c2s, v2: +endS }        // "1:1-2:3"
  if (v1 !== null) return { book, c1, v1, c2: c1, v2: +endS }   // "3:1-24"
  return { book, c1, v1: null, c2: +endS, v2: null }            // "1-3"
}

export function parsePassages(refs: string[]): Passage[] {
  return refs.map(parsePassage)
}

/** Human-readable form, e.g. "Genesis 1:1-2:3". */
export function passageLabel(p: Passage): string {
  const name = BOOK_NAMES[p.book] || `Book ${p.book}`
  if (p.v1 === null && p.v2 === null) {
    return p.c1 === p.c2 ? `${name} ${p.c1}` : `${name} ${p.c1}-${p.c2}`
  }
  if (p.c1 === p.c2) {
    return p.v1 === p.v2 ? `${name} ${p.c1}:${p.v1}` : `${name} ${p.c1}:${p.v1}-${p.v2}`
  }
  return `${name} ${p.c1}:${p.v1 ?? 1}-${p.c2}:${p.v2 ?? ''}`.replace(/:$/, '')
}

export function passagesLabel(ps: Passage[]): string {
  return ps.map(passageLabel).join('; ')
}

export interface LoadedChapter {
  book: number
  chapter: number
  verses: { v: number; t: string }[]
}

/** Verses of a passage, from a downloaded translation, grouped by chapter. */
export async function loadPassage(translation: string, p: Passage): Promise<LoadedChapter[]> {
  const out: LoadedChapter[] = []
  for (let c = p.c1; c <= p.c2; c++) {
    const rec = await db.chapters.get(chapterKey(translation, p.book, c))
    if (!rec) continue
    const from = c === p.c1 && p.v1 !== null ? p.v1 : -Infinity
    const to = c === p.c2 && p.v2 !== null ? p.v2 : Infinity
    const verses = rec.verses.filter(v => v.v >= from && v.v <= to)
    if (verses.length) out.push({ book: p.book, chapter: c, verses })
  }
  return out
}

export async function loadPassages(translation: string, ps: Passage[]): Promise<LoadedChapter[]> {
  const out: LoadedChapter[] = []
  for (const p of ps) out.push(...await loadPassage(translation, p))
  return out
}

/** Rough verse count, used to spread segments evenly across a reading plan. */
export function passageWeight(p: Passage): number {
  const chapters = p.c2 - p.c1 + 1
  if (p.v1 === null && p.v2 === null) return chapters * 28   // average chapter length
  if (p.c1 === p.c2) return Math.max(1, (p.v2 ?? 28) - (p.v1 ?? 1) + 1)
  return chapters * 28
}
