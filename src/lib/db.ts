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
  verses: { v: number; t: string }[]
}

export interface VerseRef {
  book: number
  chapter: number
  v1: number
  v2: number
  translation?: string
}

export type NoteKind = 'verse' | 'study' | 'journal'

export interface NoteRec {
  id: string
  kind: NoteKind
  title: string
  content: string
  template: string | null                    // template id for kind 'study'
  sections: Record<string, string> | null    // template section id -> text
  refs: VerseRef[]
  tags: string[]
  color: string | null                       // highlight color for verse notes
  created_at: string
  updated_at: string
  deleted: 0 | 1
  dirty: 0 | 1
}

export interface MetaRec { key: string; value: string }

class MVBDatabase extends Dexie {
  translations!: Table<TranslationRec, string>
  chapters!: Table<ChapterRec, string>
  notes!: Table<NoteRec, string>
  meta!: Table<MetaRec, string>

  constructor() {
    super('myversionbible')
    this.version(1).stores({
      translations: 'id',
      chapters: 'key, translation, [translation+book]',
      notes: 'id, kind, updated_at, dirty, deleted',
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

export async function saveNote(note: Partial<NoteRec> & { id?: string }): Promise<NoteRec> {
  const existing = note.id ? await db.notes.get(note.id) : undefined
  const rec: NoteRec = {
    id: note.id || uuid(),
    kind: note.kind ?? existing?.kind ?? 'journal',
    title: note.title ?? existing?.title ?? '',
    content: note.content ?? existing?.content ?? '',
    template: note.template ?? existing?.template ?? null,
    sections: note.sections ?? existing?.sections ?? null,
    refs: note.refs ?? existing?.refs ?? [],
    tags: note.tags ?? existing?.tags ?? [],
    color: note.color !== undefined ? note.color : (existing?.color ?? null),
    created_at: existing?.created_at ?? nowISO(),
    updated_at: nowISO(),
    deleted: 0,
    dirty: 1
  }
  await db.notes.put(rec)
  return rec
}

export async function deleteNote(id: string) {
  const existing = await db.notes.get(id)
  if (!existing) return
  await db.notes.put({ ...existing, deleted: 1, dirty: 1, updated_at: nowISO() })
}
