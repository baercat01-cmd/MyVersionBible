import { db } from './db'

export type Scope = 'all' | 'ot' | 'nt' | 'book'

export interface SearchOptions {
  translation: string
  scope: Scope
  book?: number
  wholeWord: boolean
  phrase: boolean      // exact phrase, rather than "all of these words"
  limit: number
}

export interface SearchHit {
  book: number
  chapter: number
  verse: number
  text: string
  /** [start, end) offsets of each match, for highlighting. */
  ranges: [number, number][]
}

export interface SearchResult {
  hits: SearchHit[]
  total: number        // total matching verses, even beyond the limit
  truncated: boolean
  ms: number
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** One regex per term (or a single regex for a phrase). */
export function buildMatchers(query: string, opts: Pick<SearchOptions, 'wholeWord' | 'phrase'>): RegExp[] {
  const q = query.trim()
  if (!q) return []
  const wrap = (body: string) => opts.wholeWord ? `\\b${body}\\b` : body
  if (opts.phrase) {
    // Collapse internal whitespace so "in  the beginning" still matches.
    return [new RegExp(wrap(escape(q).replace(/\s+/g, '\\s+')), 'gi')]
  }
  return q.split(/\s+/).filter(Boolean).map(t => new RegExp(wrap(escape(t)), 'gi'))
}

function matchRanges(text: string, matchers: RegExp[]): [number, number][] | null {
  const ranges: [number, number][] = []
  for (const re of matchers) {
    re.lastIndex = 0
    let found = false
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      found = true
      ranges.push([m.index, m.index + m[0].length])
      if (m[0].length === 0) re.lastIndex++    // guard against zero-length loops
    }
    if (!found) return null                     // every term must appear
  }
  return ranges.sort((a, b) => a[0] - b[0])
}

function inScope(book: number, opts: SearchOptions): boolean {
  switch (opts.scope) {
    case 'ot': return book <= 39
    case 'nt': return book >= 40
    case 'book': return book === opts.book
    default: return true
  }
}

/**
 * Scan every downloaded chapter of a translation for the query.
 *
 * A linear scan is fast enough here — about 31,000 verses — and avoids
 * maintaining an index that would have to be rebuilt on every download. The
 * scan yields to the event loop periodically so the UI keeps responding, and
 * reports progress as it goes.
 */
export async function searchScripture(
  query: string,
  opts: SearchOptions,
  onProgress?: (fraction: number) => void
): Promise<SearchResult> {
  const started = performance.now()
  const matchers = buildMatchers(query, opts)
  if (!matchers.length) return { hits: [], total: 0, truncated: false, ms: 0 }

  const keys = await db.chapters.where('translation').equals(opts.translation).primaryKeys()
  const hits: SearchHit[] = []
  let total = 0
  let done = 0

  for (const key of keys) {
    const rec = await db.chapters.get(key)
    done++
    if (rec && inScope(rec.book, opts)) {
      for (const v of rec.verses) {
        const ranges = matchRanges(v.t, matchers)
        if (!ranges) continue
        total++
        if (hits.length < opts.limit) {
          hits.push({ book: rec.book, chapter: rec.chapter, verse: v.v, text: v.t, ranges })
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
  return { hits, total, truncated: total > hits.length, ms: performance.now() - started }
}

/** Split a verse into alternating plain / matched parts for rendering. */
export function segmentHit(hit: SearchHit): { text: string; hit: boolean }[] {
  const out: { text: string; hit: boolean }[] = []
  let at = 0
  for (const [s, e] of mergeRanges(hit.ranges)) {
    if (s > at) out.push({ text: hit.text.slice(at, s), hit: false })
    out.push({ text: hit.text.slice(s, e), hit: true })
    at = e
  }
  if (at < hit.text.length) out.push({ text: hit.text.slice(at), hit: false })
  return out
}

function mergeRanges(ranges: [number, number][]): [number, number][] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const out: [number, number][] = []
  for (const r of sorted) {
    const last = out[out.length - 1]
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else out.push([...r] as [number, number])
  }
  return out
}
