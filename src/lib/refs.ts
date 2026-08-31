import type { VerseRef } from './db'
import { bookName } from './books'

export function formatRef(r: VerseRef, nameOverride?: string): string {
  const b = bookName(r.book, nameOverride)
  if (r.v1 === r.v2) return `${b} ${r.chapter}:${r.v1}`
  return `${b} ${r.chapter}:${r.v1}-${r.v2}`
}

export function formatRefs(refs: VerseRef[]): string {
  return refs.map(r => formatRef(r)).join('; ')
}
