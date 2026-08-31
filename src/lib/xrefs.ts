import { db, type XrefRec } from './db'
import { XREF_CORE } from '../data/xrefs-core'
import { parsePassage } from './passages'

/**
 * Cross references: given a verse, the passages that speak to it.
 *
 * Two sources are merged. A core set ships with the app so the feature works
 * the moment it is installed; the full public-domain dataset (openbible.info's
 * cross references, derived from the Treasury of Scripture Knowledge — roughly
 * 340,000 links) is far too large to bundle and is imported on the device.
 */
export function verseKey(book: number, chapter: number, verse: number): string {
  return `${book}:${chapter}:${verse}`
}

// The bundled set, expanded once on first use.
let coreIndex: Map<string, string[]> | null = null

function core(): Map<string, string[]> {
  if (coreIndex) return coreIndex
  const map = new Map<string, string[]>()
  for (const entry of XREF_CORE) {
    try {
      const p = parsePassage(entry.from)
      // Core entries are anchored to a single verse.
      const key = verseKey(p.book, p.c1, p.v1 ?? 1)
      const existing = map.get(key)
      if (existing) existing.push(...entry.to)
      else map.set(key, [...entry.to])
    } catch {
      // A malformed entry should never break the reader.
    }
  }
  coreIndex = map
  return map
}

export interface XrefLookup {
  targets: string[]
  fromImport: boolean
}

export async function xrefsFor(book: number, chapter: number, verse: number): Promise<XrefLookup> {
  const key = verseKey(book, chapter, verse)
  const bundled = core().get(key) || []
  const imported = (await db.xrefs.get(key))?.targets || []
  const seen = new Set<string>()
  const targets: string[] = []
  for (const t of [...bundled, ...imported]) {
    const norm = t.trim()
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    targets.push(norm)
  }
  return { targets, fromImport: imported.length > 0 }
}

export async function importedXrefCount(): Promise<number> {
  return db.xrefs.count()
}

export function coreXrefCount(): number {
  return core().size
}

export async function clearImportedXrefs(): Promise<void> {
  await db.xrefs.clear()
}

// ---------------------------------------------------------------------------
// Importing the full dataset

// openbible.info uses OSIS-style book abbreviations.
const OSIS: Record<string, number> = {
  gen: 1, exod: 2, lev: 3, num: 4, deut: 5, josh: 6, judg: 7, ruth: 8,
  '1sam': 9, '2sam': 10, '1kgs': 11, '2kgs': 12, '1chr': 13, '2chr': 14,
  ezra: 15, neh: 16, esth: 17, job: 18, ps: 19, prov: 20, eccl: 21, song: 22,
  isa: 23, jer: 24, lam: 25, ezek: 26, dan: 27, hos: 28, joel: 29, amos: 30,
  obad: 31, jonah: 32, mic: 33, nah: 34, hab: 35, zeph: 36, hag: 37, zech: 38,
  mal: 39, matt: 40, mark: 41, luke: 42, john: 43, acts: 44, rom: 45,
  '1cor': 46, '2cor': 47, gal: 48, eph: 49, phil: 50, col: 51,
  '1thess': 52, '2thess': 53, '1tim': 54, '2tim': 55, titus: 56, phlm: 57,
  heb: 58, jas: 59, '1pet': 60, '2pet': 61, '1john': 62, '2john': 63,
  '3john': 64, jude: 65, rev: 66,
  // tolerate a few common variants
  psa: 19, prv: 20, sng: 22, ezk: 26, mrk: 41, jhn: 43, php: 50, phm: 57,
  jas1: 59, rv: 66
}

// Our own compact form, for writing targets back out.
const OUT: Record<number, string> = {
  1: 'Gen', 2: 'Exo', 3: 'Lev', 4: 'Num', 5: 'Deu', 6: 'Jos', 7: 'Jdg', 8: 'Rut',
  9: '1Sa', 10: '2Sa', 11: '1Ki', 12: '2Ki', 13: '1Ch', 14: '2Ch', 15: 'Ezr',
  16: 'Neh', 17: 'Est', 18: 'Job', 19: 'Psa', 20: 'Pro', 21: 'Ecc', 22: 'Sng',
  23: 'Isa', 24: 'Jer', 25: 'Lam', 26: 'Ezk', 27: 'Dan', 28: 'Hos', 29: 'Jol',
  30: 'Amo', 31: 'Oba', 32: 'Jon', 33: 'Mic', 34: 'Nam', 35: 'Hab', 36: 'Zep',
  37: 'Hag', 38: 'Zec', 39: 'Mal', 40: 'Mat', 41: 'Mrk', 42: 'Luk', 43: 'Jhn',
  44: 'Act', 45: 'Rom', 46: '1Co', 47: '2Co', 48: 'Gal', 49: 'Eph', 50: 'Php',
  51: 'Col', 52: '1Th', 53: '2Th', 54: '1Ti', 55: '2Ti', 56: 'Tit', 57: 'Phm',
  58: 'Heb', 59: 'Jas', 60: '1Pe', 61: '2Pe', 62: '1Jn', 63: '2Jn', 64: '3Jn',
  65: 'Jud', 66: 'Rev'
}

interface OsisRef { book: number; chapter: number; verse: number }

function parseOsis(token: string): OsisRef | null {
  const m = token.trim().match(/^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/)
  if (!m) return null
  const book = OSIS[m[1].toLowerCase()]
  if (!book) return null
  return { book, chapter: +m[2], verse: +m[3] }
}

/** "Gen.1.1-Gen.1.3" → a compact "Gen 1:1-3"; single verses too. */
function osisRangeToCompact(token: string): string | null {
  const [startTok, endTok] = token.split('-')
  const start = parseOsis(startTok)
  if (!start) return null
  const name = OUT[start.book]
  if (!endTok) return `${name} ${start.chapter}:${start.verse}`
  const end = parseOsis(endTok)
  if (!end || end.book !== start.book) return `${name} ${start.chapter}:${start.verse}`
  if (end.chapter === start.chapter) {
    return end.verse === start.verse
      ? `${name} ${start.chapter}:${start.verse}`
      : `${name} ${start.chapter}:${start.verse}-${end.verse}`
  }
  return `${name} ${start.chapter}:${start.verse}-${end.chapter}:${end.verse}`
}

export interface XrefImportResult {
  sourceVerses: number
  links: number
  skipped: number
}

/**
 * Parse the openbible.info cross-reference file: tab-separated
 * `From Verse<TAB>To Verse<TAB>Votes`, with a header line. Rows with a
 * negative vote count are dropped — those are links readers voted against.
 */
export async function importXrefs(
  text: string,
  onProgress?: (fraction: number) => void
): Promise<XrefImportResult> {
  const lines = text.split(/\r?\n/)
  const grouped = new Map<string, string[]>()
  let links = 0
  let skipped = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const cols = line.split('\t')
    if (cols.length < 2) { skipped++; continue }
    if (/^from\s*verse/i.test(cols[0])) continue          // header
    const votes = cols[2] !== undefined ? parseInt(cols[2], 10) : 0
    if (Number.isFinite(votes) && votes < 0) { skipped++; continue }

    const from = parseOsis(cols[0].split('-')[0])
    const to = osisRangeToCompact(cols[1])
    if (!from || !to) { skipped++; continue }

    const key = verseKey(from.book, from.chapter, from.verse)
    const list = grouped.get(key)
    if (list) list.push(to)
    else grouped.set(key, [to])
    links++

    if (i % 20000 === 0) {
      onProgress?.(i / lines.length)
      await new Promise(r => setTimeout(r, 0))
    }
  }

  const rows: XrefRec[] = [...grouped.entries()].map(([key, targets]) => ({ key, targets }))
  await db.xrefs.clear()
  // Write in batches so a large import does not hold one huge transaction.
  for (let i = 0; i < rows.length; i += 2000) {
    await db.xrefs.bulkPut(rows.slice(i, i + 2000))
    onProgress?.(0.5 + 0.5 * (i / rows.length))
  }
  onProgress?.(1)
  return { sourceVerses: rows.length, links, skipped }
}
