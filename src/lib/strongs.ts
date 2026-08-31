import { db, chapterKey } from './db'
import { LEXICON_CORE } from '../data/lexicon-core'

/**
 * Strong's numbers link an English word to the Hebrew or Greek word behind it.
 *
 * The source texts carry them inline as `word<S>430</S>`; the importer used to
 * strip those tags as markup. They are now parsed out and stored per word, so
 * tapping a word can show the original term.
 *
 * Codes are normalised to an H or G prefix — H for the Old Testament, G for the
 * New — since the raw tags are bare numbers whose meaning depends on testament.
 */
export interface ParsedVerse {
  text: string
  /** word index -> Strong's codes, only for words that carry one. */
  strongs: Record<string, string[]>
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '')
}

/**
 * Pull the Strong's tags out of a raw verse while producing the same word
 * splitting the reader uses (a single space between words), so the indices line
 * up with what is rendered.
 */
export function parseVerse(raw: string, testament: 'H' | 'G'): ParsedVerse {
  const parts = raw.replace(/<br\s*\/?>/gi, ' ').split(/(<S>\s*\d+\s*<\/S>)/i)
  const words: string[] = []
  const strongs: Record<string, string[]> = {}
  let pendingBeforeAnyWord: string[] = []

  for (const part of parts) {
    const tag = part.match(/^<S>\s*(\d+)\s*<\/S>$/i)
    if (tag) {
      const code = testament + String(parseInt(tag[1], 10))
      if (words.length === 0) {
        pendingBeforeAnyWord.push(code)         // tag precedes its word
      } else {
        const i = String(words.length - 1)
        ;(strongs[i] ||= []).push(code)
      }
      continue
    }
    const chunk = stripTags(part)
    for (const w of chunk.split(/\s+/)) {
      if (!w) continue
      words.push(w)
      if (pendingBeforeAnyWord.length) {
        strongs['0'] = [...pendingBeforeAnyWord]
        pendingBeforeAnyWord = []
      }
    }
  }

  return { text: words.join(' '), strongs }
}

// ---------------------------------------------------------------------------
// Lexicon

export interface LexEntry {
  code: string           // e.g. "H430"
  lemma: string          // the original-language word
  translit: string
  pronounce?: string
  definition: string
  kjvUsage?: string
}

let coreIndex: Map<string, LexEntry> | null = null
function core(): Map<string, LexEntry> {
  if (!coreIndex) coreIndex = new Map(LEXICON_CORE.map(e => [e.code, e]))
  return coreIndex
}

export function coreLexiconCount(): number {
  return core().size
}

export async function lookup(code: string): Promise<LexEntry | undefined> {
  return (await db.lexicon.get(code)) || core().get(code)
}

export async function importedLexiconCount(): Promise<number> {
  return db.lexicon.count()
}

export async function clearImportedLexicon(): Promise<void> {
  await db.lexicon.clear()
}

/**
 * Import a Strong's dictionary. Accepts the two shapes these files usually
 * come in: an object keyed by code, or an array of entries. Field names vary
 * between publishers, so several spellings are accepted.
 */
export async function importLexicon(
  text: string,
  onProgress?: (fraction: number) => void
): Promise<{ entries: number; skipped: number }> {
  const parsed = JSON.parse(text)
  const rows: LexEntry[] = []
  let skipped = 0

  const pick = (o: Record<string, unknown>, keys: string[]): string => {
    for (const k of keys) {
      const v = o[k]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return ''
  }

  const add = (rawCode: string, o: Record<string, unknown>) => {
    const code = normaliseCode(rawCode)
    const definition = pick(o, ['definition', 'strongs_def', 'def', 'meaning', 'description'])
    const lemma = pick(o, ['lemma', 'word', 'original', 'greek', 'hebrew', 'unicode'])
    if (!code || (!definition && !lemma)) { skipped++; return }
    rows.push({
      code,
      lemma,
      translit: pick(o, ['translit', 'transliteration', 'xlit', 'pron']),
      pronounce: pick(o, ['pronounce', 'pronunciation']) || undefined,
      definition,
      kjvUsage: pick(o, ['kjv_def', 'kjv', 'usage', 'kjvUsage']) || undefined
    })
  }

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (item && typeof item === 'object') {
        add(pick(item, ['code', 'strongs', 'number', 'id']), item)
      } else skipped++
    }
  } else if (parsed && typeof parsed === 'object') {
    for (const [key, value] of Object.entries(parsed)) {
      if (value && typeof value === 'object') add(key, value as Record<string, unknown>)
      else skipped++
    }
  } else {
    throw new Error('Expected a JSON object keyed by Strong’s number, or an array of entries')
  }

  await db.lexicon.clear()
  for (let i = 0; i < rows.length; i += 1000) {
    await db.lexicon.bulkPut(rows.slice(i, i + 1000))
    onProgress?.(i / Math.max(rows.length, 1))
  }
  onProgress?.(1)
  return { entries: rows.length, skipped }
}

/** "H430", "h430", "430" (with a testament hint), "G0026" all normalise. */
export function normaliseCode(raw: string, testament: 'H' | 'G' = 'H'): string {
  const s = String(raw).trim()
  const m = s.match(/^([HGhg])?0*(\d+)$/)
  if (!m) return ''
  const prefix = (m[1] || testament).toUpperCase()
  return prefix + String(parseInt(m[2], 10))
}

// ---------------------------------------------------------------------------
// Finding every verse that uses one original word

export interface StrongsHit { book: number; chapter: number; verse: number; text: string; words: number[] }

export async function findByStrongs(
  translation: string,
  code: string,
  limit = 300,
  onProgress?: (fraction: number) => void
): Promise<{ hits: StrongsHit[]; total: number }> {
  const keys = await db.chapters.where('translation').equals(translation).primaryKeys()
  const hits: StrongsHit[] = []
  let total = 0
  let done = 0

  for (const key of keys) {
    const rec = await db.chapters.get(key)
    done++
    if (rec) {
      for (const v of rec.verses) {
        if (!v.s) continue
        const words = Object.entries(v.s)
          .filter(([, codes]) => codes.includes(code))
          .map(([i]) => Number(i))
        if (!words.length) continue
        total++
        if (hits.length < limit) {
          hits.push({ book: rec.book, chapter: rec.chapter, verse: v.v, text: v.t, words })
        }
      }
    }
    if (done % 60 === 0) {
      onProgress?.(done / keys.length)
      await new Promise(r => setTimeout(r, 0))
    }
  }
  onProgress?.(1)
  hits.sort((a, b) => a.book - b.book || a.chapter - b.chapter || a.verse - b.verse)
  return { hits, total }
}

/** Whether a downloaded translation carries Strong's tags at all. */
export async function hasStrongs(translation: string): Promise<boolean> {
  const keys = await db.chapters.where('translation').equals(translation).primaryKeys()
  for (const key of keys.slice(0, 40)) {
    const rec = await db.chapters.get(key)
    if (rec?.verses.some(v => v.s && Object.keys(v.s).length)) return true
  }
  return false
}

export { chapterKey }
