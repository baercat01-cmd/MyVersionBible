import { BOOK_NAMES } from './books'
import type { Passage } from './passages'

/**
 * Parsing a reference the way a listener types it.
 *
 * The chronological and harmony data are authored in a fixed abbreviated form
 * (lib/passages.ts), but someone taking sermon notes types whatever the
 * preacher said — "1 Cor 13:4-7", "Jn 3.16", "Psalm 23", "Rom 8:28-39" — often
 * while the sermon is still running. So the book is matched loosely: case,
 * spaces, full stops and the usual abbreviations are all ignored, and a
 * unique prefix match is accepted ("Philipp" → Philippians).
 */

const normalise = (s: string) => s.toLowerCase().replace(/[.\s]/g, '')

// Numbered books get their prefix spelled out too ("first john", "1st john").
function numberForms(name: string): string[] {
  const m = name.match(/^([123])\s+(.*)$/)
  if (!m) return [name]
  const [, n, rest] = m
  const words = { '1': ['1', 'i', 'first', '1st'], '2': ['2', 'ii', 'second', '2nd'], '3': ['3', 'iii', 'third', '3rd'] }[n]!
  return words.map(w => `${w} ${rest}`)
}

// Abbreviations in common use that are not simply a prefix of the full name.
const ALIASES: Record<string, number> = {
  gen: 1, ge: 1, gn: 1, ex: 2, exo: 2, exod: 2, lev: 3, lv: 3, num: 4, nm: 4, nb: 4,
  deut: 5, dt: 5, deu: 5, jos: 6, josh: 6, jdg: 7, judg: 7, jgs: 7, rut: 8, rth: 8,
  '1sam': 9, '1sa': 9, '1sm': 9, '2sam': 10, '2sa': 10, '2sm': 10,
  '1kgs': 11, '1ki': 11, '1kg': 11, '2kgs': 12, '2ki': 12, '2kg': 12,
  '1chr': 13, '1ch': 13, '1chron': 13, '2chr': 14, '2ch': 14, '2chron': 14,
  ezr: 15, neh: 16, ne: 16, est: 17, esth: 17, jb: 18,
  ps: 19, psa: 19, psalm: 19, psalms: 19, pss: 19, pslm: 19,
  pro: 20, prov: 20, prv: 20, pr: 20, ecc: 21, eccl: 21, qoh: 21,
  song: 22, songs: 22, sos: 22, sng: 22, canticles: 22, songofsongs: 22, songofsolomon: 22,
  isa: 23, is: 23, jer: 24, je: 24, lam: 25, la: 25,
  eze: 26, ezek: 26, ezk: 26, dan: 27, dn: 27, da: 27,
  hos: 28, ho: 28, joe: 29, jl: 29, joel: 29, am: 30, amo: 30,
  oba: 31, obad: 31, ob: 31, jon: 32, jnh: 32, mic: 33, mi: 33,
  nah: 34, na: 34, nam: 34, hab: 35, hb: 35, zep: 36, zeph: 36, zph: 36,
  hag: 37, hg: 37, zec: 38, zech: 38, zch: 38, mal: 39, ml: 39,
  mat: 40, matt: 40, mt: 40, mk: 41, mrk: 41, mar: 41, mark: 41,
  lk: 42, luk: 42, luke: 42, jn: 43, jhn: 43, joh: 43, john: 43,
  act: 44, acts: 44, ac: 44, rom: 45, ro: 45, rm: 45,
  '1cor': 46, '1co': 46, '2cor': 47, '2co': 47, gal: 48, ga: 48,
  eph: 49, ep: 49, phil: 50, php: 50, pp: 50, col: 51, cl: 51,
  '1thess': 52, '1thes': 52, '1th': 52, '2thess': 53, '2thes': 53, '2th': 53,
  '1tim': 54, '1ti': 54, '1tm': 54, '2tim': 55, '2ti': 55, '2tm': 55,
  tit: 56, ti: 56, tts: 56, phm: 57, phlm: 57, philem: 57,
  heb: 58, hb2: 58, jas: 59, jam: 59, jms: 59,
  '1pet': 60, '1pe': 60, '1pt': 60, '2pet': 61, '2pe': 61, '2pt': 61,
  '1jn': 62, '1jo': 62, '1joh': 62, '2jn': 63, '2jo': 63, '2joh': 63,
  '3jn': 64, '3jo': 64, '3joh': 64,
  jud: 65, jude: 65, jde: 65, rev: 66, rv: 66, apoc: 66, apocalypse: 66
}

let index: Map<string, number> | null = null

function bookIndex(): Map<string, number> {
  if (index) return index
  const map = new Map<string, number>()
  for (const [id, name] of Object.entries(BOOK_NAMES)) {
    for (const form of numberForms(name)) map.set(normalise(form), Number(id))
  }
  for (const [alias, id] of Object.entries(ALIASES)) map.set(normalise(alias), id)
  index = map
  return map
}

/**
 * Match a typed book name. An exact hit wins; failing that, a prefix that fits
 * exactly one book — so half-typed names resolve while ambiguous ones ("Jo")
 * are left alone rather than guessed at.
 */
export function matchBook(raw: string): number | null {
  const key = normalise(raw)
  if (!key) return null
  const map = bookIndex()
  const exact = map.get(key)
  if (exact) return exact
  const hits = new Set<number>()
  for (const [name, id] of map) if (name.startsWith(key)) hits.add(id)
  return hits.size === 1 ? [...hits][0] : null
}

const REF = new RegExp(
  '^\\s*([1-3]?\\s*[A-Za-z][A-Za-z.\\s]*?)\\s*' +       // book
  '(\\d+)' +                                            // chapter
  '(?:\\s*[:.]\\s*(\\d+))?' +                           // :verse
  '(?:\\s*[-–—]\\s*(?:(\\d+)\\s*[:.]\\s*)?(\\d+))?' +   // - end (verse, or chapter:verse)
  '\\s*$'
)

/** One reference, e.g. "1 Cor 13:4-7". Returns null if it will not parse. */
export function parseReference(input: string): Passage | null {
  const m = input.match(REF)
  if (!m) {
    // A book on its own means its first chapter — "Jude", "Philemon".
    const book = matchBook(input)
    return book ? { book, c1: 1, v1: null, c2: 1, v2: null } : null
  }
  const [, bookRaw, c1s, v1s, endChapS, endS] = m
  const book = matchBook(bookRaw)
  if (!book) return null

  const c1 = +c1s
  const v1 = v1s ? +v1s : null
  if (!endS) return { book, c1, v1, c2: c1, v2: v1 }
  if (endChapS) return { book, c1, v1, c2: +endChapS, v2: +endS }   // "3:16-4:2"
  if (v1 !== null) return { book, c1, v1, c2: c1, v2: +endS }        // "3:16-18"
  return { book, c1, v1: null, c2: +endS, v2: null }                 // "3-4"
}

/** Several references at once: "John 3:16; Rom 8:28, 1 Cor 13". */
export function parseReferences(input: string): Passage[] {
  return input
    .split(/[;\n]+|,(?=\s*[1-3]?\s*[A-Za-z]{2})/)
    .map(part => parseReference(part))
    .filter((p): p is Passage => p !== null)
}
