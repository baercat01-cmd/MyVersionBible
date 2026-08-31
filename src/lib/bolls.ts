// Bible text source: bolls.life — free, CORS-open corpus of public-domain
// translations served as whole-translation JSON files. Downloads happen in the
// browser and are stored fully offline in IndexedDB.
import { db, chapterKey, type BookMeta, type ChapterRec } from './db'
import { BOOK_NAMES } from './books'
import { parseVerse } from './strongs'

const BASE = 'https://bolls.life'

export interface CatalogTranslation {
  short_name: string
  full_name: string
  updated?: number
  dir?: string
}

export interface CatalogLanguage {
  language: string
  translations: CatalogTranslation[]
}

// Shown before (or if) the live catalog loads. All public domain.
export const FEATURED: { id: string; name: string; language: string }[] = [
  { id: 'KJV', name: 'King James Version 1769', language: 'English' },
  { id: 'WEB', name: 'World English Bible', language: 'English' },
  { id: 'ASV', name: 'American Standard Version 1901', language: 'English' },
  { id: 'YLT', name: "Young's Literal Translation", language: 'English' },
  { id: 'DBY', name: 'Darby Translation', language: 'English' },
  { id: 'WLC', name: 'Westminster Leningrad Codex (Hebrew OT)', language: 'Hebrew' },
  { id: 'TR', name: 'Textus Receptus (Greek NT)', language: 'Greek' }
]

export async function fetchCatalog(): Promise<CatalogLanguage[]> {
  const res = await fetch(`${BASE}/static/bolls/app/views/languages.json`)
  if (!res.ok) throw new Error(`Catalog fetch failed (${res.status})`)
  return res.json()
}

interface RawVerse { book: number; chapter: number; verse: number; text: string }

// Kept for callers that only want the words.
export function cleanVerseText(t: string): string {
  return parseVerse(t, 'H').text
}

async function fetchBookNames(id: string): Promise<Record<number, string>> {
  try {
    const res = await fetch(`${BASE}/get-books/${id}/`)
    if (!res.ok) return {}
    const books: { bookid: number; name: string }[] = await res.json()
    return Object.fromEntries(books.map(b => [b.bookid, b.name]))
  } catch {
    return {}
  }
}

export async function downloadTranslation(
  id: string,
  fullName: string,
  language: string,
  onProgress?: (msg: string) => void
): Promise<void> {
  onProgress?.('Downloading text…')
  const res = await fetch(`${BASE}/static/translations/${id}.json`)
  if (!res.ok) throw new Error(`Download failed for ${id} (${res.status})`)
  const verses: RawVerse[] = await res.json()
  onProgress?.(`Processing ${verses.length.toLocaleString()} verses…`)
  await storeTranslation(id, fullName, language, verses, onProgress)
}

// Also used by "import from file" fallback.
export async function storeTranslation(
  id: string,
  fullName: string,
  language: string,
  verses: RawVerse[],
  onProgress?: (msg: string) => void
): Promise<void> {
  const chapters = new Map<string, ChapterRec>()
  const bookChapters = new Map<number, number>()

  for (const v of verses) {
    const key = chapterKey(id, v.book, v.chapter)
    let ch = chapters.get(key)
    if (!ch) {
      ch = { key, translation: id, book: v.book, chapter: v.chapter, verses: [] }
      chapters.set(key, ch)
    }
    // Books 1-39 are Hebrew, 40-66 Greek; Strong's numbers are only unique
    // within their own testament, so the prefix has to come from the book.
    const parsed = parseVerse(v.text, v.book >= 40 ? 'G' : 'H')
    ch.verses.push(
      Object.keys(parsed.strongs).length
        ? { v: v.verse, t: parsed.text, s: parsed.strongs }
        : { v: v.verse, t: parsed.text }
    )
    bookChapters.set(v.book, Math.max(bookChapters.get(v.book) || 0, v.chapter))
  }

  const names = await fetchBookNames(id)
  const books: BookMeta[] = [...bookChapters.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bookid, count]) => ({
      bookid,
      name: names[bookid] || BOOK_NAMES[bookid] || `Book ${bookid}`,
      chapters: count
    }))

  onProgress?.('Saving offline…')
  await db.transaction('rw', db.chapters, db.translations, async () => {
    await db.chapters.where('translation').equals(id).delete()
    await db.chapters.bulkPut([...chapters.values()])
    await db.translations.put({
      id,
      name: fullName,
      language,
      books,
      verseCount: verses.length,
      downloadedAt: new Date().toISOString()
    })
  })
}

export async function removeTranslation(id: string): Promise<void> {
  await db.transaction('rw', db.chapters, db.translations, async () => {
    await db.chapters.where('translation').equals(id).delete()
    await db.translations.delete(id)
  })
}
