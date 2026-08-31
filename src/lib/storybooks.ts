import { db, type StoryBookRec } from './db'

/**
 * Import a narrative retelling of the Bible from a plain-text file.
 *
 * The obvious candidate is Hurlbut's "Story of the Bible" (1904), which is
 * public domain and freely downloadable from Project Gutenberg — but nothing
 * here is specific to it, so any public-domain story book works. Splitting is
 * pattern-driven with a preview, because plain-text books do not agree on how
 * they mark a chapter.
 */
export interface SplitPattern {
  id: string
  label: string
  test: (line: string) => boolean
}

export const SPLIT_PATTERNS: SplitPattern[] = [
  {
    id: 'story',
    label: 'Story One. / Story Two. …',
    test: l => /^\s*STORY\s+[A-Z0-9]+\b/i.test(l)
  },
  {
    id: 'chapter',
    label: 'Chapter I / Chapter 1 …',
    test: l => /^\s*CHAPTER\s+[IVXLCDM0-9]+\b/i.test(l)
  },
  {
    id: 'caps',
    label: 'Headings in CAPITALS',
    // A short, mostly-uppercase line with no sentence-ending punctuation.
    test: l => {
      const t = l.trim()
      if (t.length < 3 || t.length > 90) return false
      if (!/[A-Z]/.test(t)) return false
      if (/[.?!]$/.test(t) && t.split(/\s+/).length > 8) return false
      return t === t.toUpperCase()
    }
  },
  {
    id: 'numbered',
    label: 'Lines beginning with a number',
    test: l => /^\s*\d{1,3}[.)]\s+\S/.test(l)
  }
]

/** Strip the Project Gutenberg licence header and footer if present. */
export function stripGutenberg(text: string): string {
  const start = text.match(/^\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG.*$/im)
  const end = text.match(/^\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG.*$/im)
  let out = text
  if (start && start.index !== undefined) out = out.slice(start.index + start[0].length)
  if (end) {
    const i = out.search(/^\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG.*$/im)
    if (i > 0) out = out.slice(0, i)
  }
  return out
}

export interface ParsedChapter { n: number; title: string; text: string }

export function splitIntoChapters(raw: string, patternId: string): ParsedChapter[] {
  const pattern = SPLIT_PATTERNS.find(p => p.id === patternId) || SPLIT_PATTERNS[0]
  const lines = stripGutenberg(raw).split(/\r?\n/)

  const chapters: ParsedChapter[] = []
  let title: string | null = null
  let buffer: string[] = []

  const flush = () => {
    if (title === null) return
    const text = buffer.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    if (text) chapters.push({ n: chapters.length + 1, title, text })
    buffer = []
  }

  for (const line of lines) {
    if (pattern.test(line)) {
      flush()
      title = line.trim().replace(/\s+/g, ' ')
    } else if (title !== null) {
      buffer.push(line)
    }
  }
  flush()
  return chapters
}

/** Paragraphs of a chapter, for rendering as prose. */
export function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map(p => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
}

export async function saveStoryBook(
  title: string, author: string, chapters: ParsedChapter[]
): Promise<StoryBookRec> {
  const rec: StoryBookRec = {
    id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'storybook',
    title, author, chapters,
    importedAt: new Date().toISOString()
  }
  await db.storybooks.put(rec)
  return rec
}

export async function removeStoryBook(id: string): Promise<void> {
  await db.storybooks.delete(id)
}
