import { db, type NoteRec, type VerseRef } from './db'
import { bookName } from './books'

/**
 * Finding links between your own studies — the "you wrote about this before"
 * problem — without a model, a key, a network, or anything leaving the device.
 *
 * Three signals, in descending order of how much they actually mean:
 * passages that overlap, tags in common, and distinctive words in common.
 * Every connection says why it is there, so it can be judged rather than
 * trusted.
 */
export interface Connection {
  note: NoteRec
  score: number
  reasons: string[]
}

// Words too common to say anything about what a note is about. Includes the
// King James function words, since notes quote scripture heavily.
const STOP = new Set(`
a about above after against all also am an and any are as at be because been before being
below between both but by came can cannot come could did do does doing done down during
each even ever every for from further had has have having he her here hers herself him
himself his how i if in into is it its itself just let like made make man may me might
more most much must my myself no nor not now of off on once only or other ought our ours
ourselves out over own said same say says shall she should since so some such than that
the their theirs them themselves then there these they thing things this those thou thee
thy through thus to too under unto up upon us very was we were what when where which while
who whom why will with within without would ye you your yours yourself yourselves
lord god jesus christ verse chapter book study note
`.trim().split(/\s+/))

function textOf(n: NoteRec): string {
  return [n.title, n.content, ...Object.values(n.sections || {})].join(' ')
}

function terms(n: NoteRec): Set<string> {
  const out = new Set<string>()
  for (const raw of textOf(n).toLowerCase().split(/[^a-z']+/)) {
    const w = raw.replace(/^'+|'+$/g, '')
    if (w.length > 4 && !STOP.has(w)) out.add(w)
  }
  return out
}

function refsOverlap(a: VerseRef, b: VerseRef): boolean {
  return a.book === b.book && a.chapter === b.chapter && a.v1 <= b.v2 && b.v1 <= a.v2
}

function sameChapter(a: VerseRef, b: VerseRef): boolean {
  return a.book === b.book && a.chapter === b.chapter
}

/** Notes and studies related to this one, strongest first. */
export async function connectionsFor(note: NoteRec, limit = 8): Promise<Connection[]> {
  const all = await db.notes
    .filter(n => !n.deleted && n.kind !== 'mark' && n.id !== note.id)
    .toArray()

  const myTerms = terms(note)
  const myTags = new Set(note.tags.map(t => t.toLowerCase()))

  const scored: Connection[] = []
  for (const other of all) {
    const reasons: string[] = []
    let score = 0

    // Passages in common — the strongest signal.
    const overlapping = new Set<string>()
    const nearby = new Set<string>()
    for (const a of note.refs) {
      for (const b of other.refs) {
        if (refsOverlap(a, b)) overlapping.add(`${bookName(a.book)} ${a.chapter}`)
        else if (sameChapter(a, b)) nearby.add(`${bookName(a.book)} ${a.chapter}`)
      }
    }
    for (const passage of overlapping) { score += 6; reasons.push(`same passage — ${passage}`) }
    for (const passage of nearby) { score += 3; reasons.push(`same chapter — ${passage}`) }

    // Tags in common.
    for (const tag of other.tags) {
      if (myTags.has(tag.toLowerCase())) { score += 3; reasons.push(`tagged “${tag}”`) }
    }

    // Distinctive words in common.
    const shared: string[] = []
    for (const t of terms(other)) if (myTerms.has(t)) shared.push(t)
    if (shared.length) {
      score += Math.min(shared.length, 5)
      reasons.push(`both discuss ${shared.slice(0, 4).map(w => `“${w}”`).join(', ')}`)
    }

    if (score > 0) scored.push({ note: other, score, reasons })
  }

  return scored
    .sort((a, b) => b.score - a.score || b.note.updated_at.localeCompare(a.note.updated_at))
    .slice(0, limit)
}

/**
 * Themes running through everything written so far: tags and distinctive words
 * that recur across several separate notes.
 */
export interface Thread { term: string; kind: 'tag' | 'word'; notes: NoteRec[] }

export async function threads(minNotes = 3, limit = 20): Promise<Thread[]> {
  const all = await db.notes
    .filter(n => !n.deleted && n.kind !== 'mark')
    .toArray()

  const byTag = new Map<string, NoteRec[]>()
  const byWord = new Map<string, NoteRec[]>()

  for (const n of all) {
    for (const tag of new Set(n.tags.map(t => t.toLowerCase()))) {
      if (!tag) continue
      ;(byTag.get(tag) ?? byTag.set(tag, []).get(tag)!).push(n)
    }
    for (const w of terms(n)) {
      ;(byWord.get(w) ?? byWord.set(w, []).get(w)!).push(n)
    }
  }

  const out: Thread[] = []
  for (const [term, notes] of byTag) if (notes.length >= minNotes) out.push({ term, kind: 'tag', notes })
  for (const [term, notes] of byWord) {
    if (notes.length >= minNotes && !byTag.has(term)) out.push({ term, kind: 'word', notes })
  }

  return out.sort((a, b) => b.notes.length - a.notes.length || a.term.localeCompare(b.term)).slice(0, limit)
}
