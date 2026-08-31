import Dexie, { type Table } from 'dexie'

export interface BookMeta {
  bookid: number
  name: string
  chapters: number
}

export interface TranslationRec {
  id: string            // short name, e.g. 'KJV'
  name: string          // full name
  language: string
  books: BookMeta[]     // derived from downloaded data
  verseCount: number
  downloadedAt: string  // ISO
}

export interface ChapterRec {
  key: string           // `${translation}:${book}:${chapter}`
  translation: string
  book: number
  chapter: number
  verses: {
    v: number
    t: string
    /** word index -> Strong's codes, present only for tagged translations. */
    s?: Record<string, string[]>
  }[]
}

export interface VerseRef {
  book: number
  chapter: number
  v1: number
  v2: number
  translation?: string
}

// 'mark' = a visual mark drawn over the text (highlight, underline, box, strike).
export type NoteKind = 'verse' | 'study' | 'journal' | 'mark'

export type MarkStyle = 'highlight' | 'underline' | 'box' | 'strike'

export interface NoteRec {
  id: string
  kind: NoteKind
  title: string
  content: string
  template: string | null                    // template id for kind 'study'
  sections: Record<string, string> | null    // template section id -> text
  refs: VerseRef[]
  tags: string[]
  color: string | null                       // mark colour id
  style: MarkStyle | null                    // how a mark is drawn
  words: number[] | null                     // word indices within the verse; null = whole verse
  created_at: string
  updated_at: string
  deleted: 0 | 1
  dirty: 0 | 1
  chapterKeys?: string[]                     // local-only index: `${book}:${chapter}` per ref
}

export interface MetaRec { key: string; value: string }

/**
 * Cross references for one verse. Keyed `${book}:${chapter}:${verse}` so a
 * lookup while reading is a single indexed get.
 */
export interface XrefRec {
  key: string
  targets: string[]     // compact references, parsed by lib/passages.ts
}

/**
 * A named list of verses gathered from anywhere in the Bible, with optional
 * spaced-repetition review state per verse for memorising them.
 */
export interface CollectionItem {
  ref: VerseRef
  added_at: string
  /** Review state — absent until the verse is first reviewed. */
  box?: number          // 0-5; higher means seen correctly more often
  due?: string          // ISO date this verse is next due
}

export interface CollectionRec {
  id: string
  name: string
  description: string
  items: CollectionItem[]
  memorize: boolean
  created_at: string
  updated_at: string
  deleted: 0 | 1
  dirty: 0 | 1
}

/** One Strong's dictionary entry, keyed by its code (e.g. "H430"). */
export interface LexRec {
  code: string
  lemma: string
  translit: string
  pronounce?: string
  definition: string
  kjvUsage?: string
}

/**
 * A freehand stylus stroke drawn over a chapter.
 * Points are normalised to the width of the text column (x in 0..1, y in the
 * same units) so drawings stay put when the window, font size or device changes.
 */
export interface StrokeRec {
  id: string
  pageKey: string          // `${translation}:${book}:${chapter}`
  translation: string
  book: number
  chapter: number
  tool: 'pen' | 'marker'
  color: string            // hex
  width: number            // normalised stroke width
  points: number[]         // flat [x0,y0,x1,y1,...]
  created_at: string
  updated_at: string
  deleted: 0 | 1
  dirty: 0 | 1
}

/**
 * A narrative retelling of the Bible read alongside scripture — e.g. Hurlbut's
 * "Story of the Bible" (1904, public domain). Imported from a plain-text or
 * JSON file rather than downloaded, so any public-domain story book works.
 */
export interface StoryBookRec {
  id: string
  title: string
  author: string
  chapters: { n: number; title: string; text: string }[]
  importedAt: string
}

export function pageKey(translation: string, book: number, chapter: number): string {
  return `${translation}:${book}:${chapter}`
}

// Local-only multiEntry index so a chapter's marks and notes load without
// scanning every note on the device.
export function refChapterKeys(refs: VerseRef[]): string[] {
  return [...new Set(refs.map(r => `${r.book}:${r.chapter}`))]
}

class MVBDatabase extends Dexie {
  translations!: Table<TranslationRec, string>
  chapters!: Table<ChapterRec, string>
  notes!: Table<NoteRec, string>
  strokes!: Table<StrokeRec, string>
  storybooks!: Table<StoryBookRec, string>
  xrefs!: Table<XrefRec, string>
  lexicon!: Table<LexRec, string>
  collections!: Table<CollectionRec, string>
  meta!: Table<MetaRec, string>

  constructor() {
    super('myversionbible')
    this.version(1).stores({
      translations: 'id',
      chapters: 'key, translation, [translation+book]',
      notes: 'id, kind, updated_at, dirty, deleted',
      meta: 'key'
    })
    this.version(2).stores({
      translations: 'id',
      chapters: 'key, translation, [translation+book]',
      notes: 'id, kind, updated_at, dirty, deleted, *chapterKeys',
      meta: 'key'
    }).upgrade(tx => tx.table('notes').toCollection().modify((n: NoteRec) => {
      // Highlights used to be stored as empty 'verse' notes carrying a colour.
      // Promote those to first-class marks so they keep rendering over the text.
      if (n.kind === 'verse' && n.color && !n.content && !n.title) {
        n.kind = 'mark'
        n.style = 'highlight'
        n.dirty = 1
      }
      n.style = n.style ?? null
      n.words = n.words ?? null
      n.chapterKeys = refChapterKeys(n.refs || [])
    }))
    this.version(3).stores({
      translations: 'id',
      chapters: 'key, translation, [translation+book]',
      notes: 'id, kind, updated_at, dirty, deleted, *chapterKeys',
      strokes: 'id, pageKey, updated_at, dirty, deleted',
      meta: 'key'
    })
    this.version(4).stores({
      translations: 'id',
      chapters: 'key, translation, [translation+book]',
      notes: 'id, kind, updated_at, dirty, deleted, *chapterKeys',
      strokes: 'id, pageKey, updated_at, dirty, deleted',
      storybooks: 'id',
      meta: 'key'
    })
    this.version(5).stores({
      translations: 'id',
      chapters: 'key, translation, [translation+book]',
      notes: 'id, kind, updated_at, dirty, deleted, *chapterKeys',
      strokes: 'id, pageKey, updated_at, dirty, deleted',
      storybooks: 'id',
      xrefs: 'key',
      meta: 'key'
    })
    this.version(6).stores({
      translations: 'id',
      chapters: 'key, translation, [translation+book]',
      notes: 'id, kind, updated_at, dirty, deleted, *chapterKeys',
      strokes: 'id, pageKey, updated_at, dirty, deleted',
      storybooks: 'id',
      xrefs: 'key',
      lexicon: 'code',
      meta: 'key'
    })
    this.version(7).stores({
      translations: 'id',
      chapters: 'key, translation, [translation+book]',
      notes: 'id, kind, updated_at, dirty, deleted, *chapterKeys',
      strokes: 'id, pageKey, updated_at, dirty, deleted',
      storybooks: 'id',
      xrefs: 'key',
      lexicon: 'code',
      collections: 'id, updated_at, dirty, deleted',
      meta: 'key'
    })
  }
}

export const db = new MVBDatabase()

export function chapterKey(translation: string, book: number, chapter: number): string {
  return `${translation}:${book}:${chapter}`
}

export async function getChapter(translation: string, book: number, chapter: number) {
  return db.chapters.get(chapterKey(translation, book, chapter))
}

export function uuid(): string {
  return crypto.randomUUID()
}

export function nowISO(): string {
  return new Date().toISOString()
}

/** All notes and marks anchored anywhere in one chapter. */
export async function notesInChapter(book: number, chapter: number): Promise<NoteRec[]> {
  const hits = await db.notes.where('chapterKeys').equals(`${book}:${chapter}`).toArray()
  return hits.filter(n => !n.deleted)
}

export async function saveNote(note: Partial<NoteRec> & { id?: string }): Promise<NoteRec> {
  const existing = note.id ? await db.notes.get(note.id) : undefined
  const refs = note.refs ?? existing?.refs ?? []
  const rec: NoteRec = {
    id: note.id || uuid(),
    kind: note.kind ?? existing?.kind ?? 'journal',
    title: note.title ?? existing?.title ?? '',
    content: note.content ?? existing?.content ?? '',
    template: note.template ?? existing?.template ?? null,
    sections: note.sections ?? existing?.sections ?? null,
    refs,
    tags: note.tags ?? existing?.tags ?? [],
    color: note.color !== undefined ? note.color : (existing?.color ?? null),
    style: note.style !== undefined ? note.style : (existing?.style ?? null),
    words: note.words !== undefined ? note.words : (existing?.words ?? null),
    created_at: existing?.created_at ?? nowISO(),
    updated_at: nowISO(),
    deleted: 0,
    dirty: 1,
    chapterKeys: refChapterKeys(refs)
  }
  await db.notes.put(rec)
  return rec
}

export async function deleteNote(id: string) {
  const existing = await db.notes.get(id)
  if (!existing) return
  await db.notes.put({ ...existing, deleted: 1, dirty: 1, updated_at: nowISO() })
}

/**
 * Mark a range that may cover part of a verse, a phrase crossing verses, whole
 * verses, or a chapter. One record is stored per verse — each carrying its own
 * word list, or null for the whole verse — so rendering and erasing stay a
 * simple per-verse lookup.
 */
export async function saveMarkRange(
  book: number,
  chapter: number,
  translation: string,
  perVerse: { verse: number; words: number[] | null }[],
  style: MarkStyle,
  color: string
): Promise<void> {
  for (const { verse, words } of perVerse) {
    if (words && words.length === 0) continue
    await saveMark({ book, chapter, v1: verse, v2: verse, translation }, style, color, words)
  }
}

/** Erase marks across every verse of a range. */
export async function eraseRange(
  book: number,
  chapter: number,
  perVerse: { verse: number; words: number[] | null }[]
): Promise<number> {
  let removed = 0
  for (const { verse, words } of perVerse) {
    removed += await eraseMarks(book, chapter, verse, words)
  }
  return removed
}

/** Add a mark over a whole verse range, or over specific words of one verse. */
export async function saveMark(
  ref: VerseRef,
  style: MarkStyle,
  color: string,
  words: number[] | null
): Promise<NoteRec> {
  return saveNote({
    kind: 'mark',
    title: '',
    content: '',
    refs: [ref],
    color,
    style,
    words: words && words.length ? [...words].sort((a, b) => a - b) : null
  })
}

/**
 * Erase marks touching a selection. A whole-verse selection clears every mark on
 * that verse; a word selection clears only marks covering those words.
 */
export async function eraseMarks(
  book: number,
  chapter: number,
  verse: number,
  words: number[] | null
): Promise<number> {
  const inChapter = await notesInChapter(book, chapter)
  const hits = inChapter.filter(n => {
    if (n.kind !== 'mark') return false
    const covers = n.refs.some(r => r.book === book && r.chapter === chapter && verse >= r.v1 && verse <= r.v2)
    if (!covers) return false
    if (!words || !words.length) return true          // clearing the whole verse
    if (!n.words) return true                          // whole-verse mark under a word selection
    return n.words.some(w => words.includes(w))
  })
  for (const h of hits) await deleteNote(h.id)
  return hits.length
}
