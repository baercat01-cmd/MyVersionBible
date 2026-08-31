/** One titled step in a chronological or harmony reading order. */
export interface Segment {
  id: string          // stable — reading-plan progress is keyed on it
  era: string         // Era.id
  title: string
  refs: string[]      // compact references, parsed by src/lib/passages.ts
  note?: string       // flagged where the placement is a scholarly judgement call
}

export interface Era {
  id: string
  title: string
  subtitle: string
}
