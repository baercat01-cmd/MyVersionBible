import { db, saveNote, type NoteRec, type VerseRef } from './db'
import { formatRef } from './refs'
import { parseReference } from './parseref'
import type { Passage } from './passages'
import { loadPassage, passageLabel } from './passages'

/**
 * Sermon notes: what a listener writes down while someone else is preaching.
 *
 * They ride on the same note record as everything else — kind 'sermon', the
 * template sections carrying the structure — so they sync, search, print and
 * thread alongside studies and journal entries with no separate machinery.
 * The parts that need structure (who preached, the outline, the words to look
 * up, the questions to chase) are stored as plain text lines rather than
 * nested objects, so they stay readable in the printed book and in search.
 */

export const SERMON_TEMPLATE = {
  id: 'sermon',
  name: 'Sermon Notes',
  description: 'Listen now, study deeper later',
  sections: [
    { id: 'bigidea', label: 'Big idea', hint: 'The one sentence the sermon is making.' },
    { id: 'points', label: 'Outline', hint: 'Each point, with the verse it came from.' },
    { id: 'words', label: 'Words to look at', hint: "Original words noticed — add them from the passage panel." },
    { id: 'quotes', label: 'Quotes & illustrations', hint: 'Anything worth keeping word for word.' },
    { id: 'application', label: 'Application', hint: 'What this asks of you this week.' },
    { id: 'questions', label: 'Questions to study later', hint: 'One per line — these carry into the study you make from this.' }
  ]
} as const

/** Fields that describe the occasion rather than the content. */
export const SERMON_META = ['speaker', 'series', 'place', 'preached'] as const
export type SermonMetaKey = typeof SERMON_META[number]

export function sermonMeta(note: NoteRec | undefined, key: SermonMetaKey): string {
  return note?.sections?.[key] || ''
}

/** A line of the outline: what was said, and the verse it was said from. */
export interface SermonPoint {
  text: string
  ref: VerseRef | null
}

const SEP = ' — '

export function formatPoint(p: SermonPoint): string {
  return p.ref ? `${formatRef(p.ref)}${SEP}${p.text}` : p.text
}

export function serialisePoints(points: SermonPoint[]): string {
  return points.filter(p => p.text.trim() || p.ref).map(formatPoint).join('\n')
}

/**
 * Read the outline back. The stored form is human-written text, so anything
 * that does not carry a reference simply comes back as a point without one.
 */
export function parsePoints(text: string | undefined): SermonPoint[] {
  if (!text) return []
  return text.split('\n').filter(l => l.trim()).map(line => {
    const at = line.indexOf(SEP)
    if (at > 0) {
      const passage = parseReference(line.slice(0, at))
      if (passage) return { text: line.slice(at + SEP.length), ref: passageToRef(passage) }
    }
    return { text: line, ref: null }
  })
}

/** The first verse of a parsed passage, as an anchorable reference. */
export function passageToRef(p: Passage, translation?: string): VerseRef {
  return {
    book: p.book,
    chapter: p.c1,
    v1: p.v1 ?? 1,
    v2: p.c2 === p.c1 ? (p.v2 ?? p.v1 ?? 1) : (p.v2 ?? 1),
    translation
  }
}

/**
 * Turn a typed reference into anchored references, one per chapter, clamped to
 * the verses the chosen version actually has. Falls back to the parsed numbers
 * when the passage is not downloaded, so a reference still records fine on a
 * device that has not got that version.
 */
export async function resolveReference(
  input: string,
  translation: string
): Promise<{ refs: VerseRef[]; label: string } | null> {
  const p = parseReference(input)
  if (!p) return null
  const label = passageLabel(p)
  const chapters = translation ? await loadPassage(translation, p) : []
  if (!chapters.length) return { refs: [passageToRef(p, translation || undefined)], label }
  const refs = chapters.map(c => ({
    book: c.book,
    chapter: c.chapter,
    v1: c.verses[0].v,
    v2: c.verses[c.verses.length - 1].v,
    translation: translation || undefined
  }))
  return { refs, label }
}

/** A one-line description for the list: who preached it, and when. */
export function sermonSubtitle(note: NoteRec): string {
  const bits = [
    sermonMeta(note, 'speaker'),
    sermonMeta(note, 'series'),
    sermonMeta(note, 'place')
  ].filter(Boolean)
  const when = sermonMeta(note, 'preached')
  if (when) bits.push(new Date(when + 'T00:00').toLocaleDateString())
  return bits.join(' · ')
}

export async function sermonNotes(): Promise<NoteRec[]> {
  const all = await db.notes.where('kind').equals('sermon').and(n => !n.deleted).toArray()
  return all.sort((a, b) =>
    (sermonMeta(b, 'preached') || b.created_at).localeCompare(sermonMeta(a, 'preached') || a.created_at))
}

/**
 * Carry a sermon into a study of your own.
 *
 * The passage, the questions raised and the words noticed become the starting
 * point of an inductive study, and the two notes share a tag so they find each
 * other again later.
 */
export async function studyFromSermon(note: NoteRec): Promise<NoteRec> {
  const s = note.sections || {}
  const outline = parsePoints(s.points).map(p => `• ${formatPoint(p)}`).join('\n')
  const speaker = sermonMeta(note, 'speaker')
  const heard = [speaker && `Preached by ${speaker}`, sermonMeta(note, 'place')].filter(Boolean).join(', ')

  const observation = [
    s.bigidea && `The sermon's point: ${s.bigidea}`,
    outline && `What was said:\n${outline}`
  ].filter(Boolean).join('\n\n')

  const interpretation = [
    s.words && `Words to look at:\n${s.words}`,
    s.questions && `Questions raised:\n${s.questions}`
  ].filter(Boolean).join('\n\n')

  return saveNote({
    kind: 'study',
    title: `Study: ${note.title || 'sermon'}`,
    template: 'inductive',
    refs: note.refs,
    sections: {
      context: heard ? `Heard ${heard}.` : '',
      observation,
      interpretation,
      application: s.application || ''
    },
    tags: [...new Set([...note.tags, 'from-sermon'])]
  })
}
