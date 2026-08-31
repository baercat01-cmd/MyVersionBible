/**
 * A one-shot request to open the reader at a passage. Search results, cross
 * references and collections all need "take me to this verse", and this keeps
 * that from turning into prop-drilling through every view.
 */
export interface JumpTarget {
  translation?: string
  book: number
  chapter: number
  verse?: number
}

let pending: JumpTarget | null = null
const listeners = new Set<() => void>()

export function requestJump(target: JumpTarget): void {
  pending = target
  listeners.forEach(l => l())
}

/** Consume the pending jump, if any. */
export function takeJump(): JumpTarget | null {
  const p = pending
  pending = null
  return p
}

export function onJump(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
