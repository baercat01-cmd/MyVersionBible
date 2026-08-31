import type { CSSProperties } from 'react'
import type { MarkStyle, NoteRec } from './db'

export interface MarkColor { id: string; label: string; hex: string }

export const MARK_COLORS: MarkColor[] = [
  { id: 'yellow', label: 'Yellow', hex: '#e0a72b' },
  { id: 'green', label: 'Green', hex: '#4f8a52' },
  { id: 'blue', label: 'Blue', hex: '#3f76b5' },
  { id: 'pink', label: 'Pink', hex: '#c4557f' },
  { id: 'orange', label: 'Orange', hex: '#d2712f' },
  { id: 'purple', label: 'Purple', hex: '#7d5aa8' }
]

export const MARK_STYLES: { id: MarkStyle; label: string; glyph: string }[] = [
  { id: 'highlight', label: 'Highlight', glyph: '▧' },
  { id: 'underline', label: 'Underline', glyph: 'U' },
  { id: 'box', label: 'Box', glyph: '▭' },
  { id: 'strike', label: 'Strike through', glyph: 'S' }
]

export function colorHex(id: string | null): string {
  return MARK_COLORS.find(c => c.id === id)?.hex || MARK_COLORS[0].hex
}

/**
 * Split a verse into words. Verse text is already whitespace-normalised on
 * import, so a plain space split gives stable indices to anchor marks to.
 */
export function tokenize(text: string): string[] {
  return text.split(' ')
}

export interface AppliedMark { style: MarkStyle; color: string }

/**
 * Marks that apply to each word of one verse, keyed by word index.
 * Whole-verse marks (words === null) apply to every word.
 */
export function marksForVerse(
  notes: NoteRec[],
  book: number,
  chapter: number,
  verse: number,
  wordCount: number
): Map<number, AppliedMark[]> {
  const byWord = new Map<number, AppliedMark[]>()
  const add = (i: number, m: AppliedMark) => {
    const list = byWord.get(i)
    if (!list) byWord.set(i, [m])
    else if (!list.some(x => x.style === m.style && x.color === m.color)) list.push(m)
  }

  for (const n of notes) {
    if (n.kind !== 'mark' || !n.style) continue
    const covers = n.refs.some(r =>
      r.book === book && r.chapter === chapter && verse >= r.v1 && verse <= r.v2)
    if (!covers) continue
    const applied: AppliedMark = { style: n.style, color: n.color || 'yellow' }
    if (n.words && n.words.length) {
      for (const i of n.words) if (i < wordCount) add(i, applied)
    } else {
      for (let i = 0; i < wordCount; i++) add(i, applied)
    }
  }
  return byWord
}

/** Inline CSS for the marks on a single word, layered so several can coexist. */
export function markStyle(applied: AppliedMark[] | undefined): CSSProperties {
  if (!applied || !applied.length) return {}
  const css: CSSProperties = {}
  const shadows: string[] = []
  const decorations: string[] = []

  for (const m of applied) {
    const hex = colorHex(m.color)
    switch (m.style) {
      case 'highlight':
        // 38% alpha reads clearly on both light and dark backgrounds.
        css.background = `${hex}61`
        css.borderRadius = '3px'
        break
      case 'underline':
        shadows.push(`inset 0 -0.14em 0 0 ${hex}`)
        break
      case 'box':
        css.outline = `1.5px solid ${hex}`
        css.outlineOffset = '1px'
        css.borderRadius = '3px'
        break
      case 'strike':
        decorations.push('line-through')
        css.textDecorationColor = hex
        css.textDecorationThickness = '2px'
        break
    }
  }
  if (shadows.length) css.boxShadow = shadows.join(', ')
  if (decorations.length) css.textDecorationLine = decorations.join(' ')
  return css
}
