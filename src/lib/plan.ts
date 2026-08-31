import { db } from './db'
import { CHRONOLOGY } from '../data/chronology'
import { parsePassages, passageWeight } from './passages'
import type { Segment } from '../data/types'

const PROGRESS_KEY = 'plan-progress'
const START_KEY = 'plan-start'
const DATES_KEY = 'plan-read-dates'

export interface PlanDay {
  day: number          // 1-365
  segments: Segment[]
}

/**
 * The chronological order spread over a year. Days are sized by how much text
 * they contain rather than by segment count, so a day of genealogies is not the
 * same length as a day of the passion narrative.
 */
export function buildPlan(days = 365): PlanDay[] {
  const weighted = CHRONOLOGY.map(s => ({
    segment: s,
    weight: s.refs.length ? parsePassages(s.refs).reduce((n, p) => n + passageWeight(p), 0) : 1
  }))
  const total = weighted.reduce((n, w) => n + w.weight, 0)
  const target = total / days

  const plan: PlanDay[] = []
  let current: Segment[] = []
  let carried = 0

  for (let i = 0; i < weighted.length; i++) {
    current.push(weighted[i].segment)
    carried += weighted[i].weight
    const daysLeft = days - plan.length
    const segmentsLeft = weighted.length - i - 1
    // Close the day once it is full, but never so greedily that the remaining
    // segments cannot fill the remaining days.
    if ((carried >= target && plan.length < days - 1) || segmentsLeft < daysLeft) {
      plan.push({ day: plan.length + 1, segments: current })
      current = []
      carried = 0
    }
  }
  if (current.length) plan.push({ day: plan.length + 1, segments: current })
  return plan
}

export async function getCompleted(): Promise<Set<string>> {
  const rec = await db.meta.get(PROGRESS_KEY)
  try {
    return new Set<string>(rec ? JSON.parse(rec.value) : [])
  } catch {
    return new Set<string>()
  }
}

export async function setCompleted(ids: Set<string>): Promise<void> {
  await db.meta.put({ key: PROGRESS_KEY, value: JSON.stringify([...ids]) })
}

export async function toggleCompleted(id: string): Promise<Set<string>> {
  const done = await getCompleted()
  done.has(id) ? done.delete(id) : done.add(id)
  await setCompleted(done)
  return done
}

export async function getStartDate(): Promise<string | null> {
  return (await db.meta.get(START_KEY))?.value ?? null
}

export async function startPlan(): Promise<string> {
  const today = new Date().toISOString().slice(0, 10)
  await db.meta.put({ key: START_KEY, value: today })
  return today
}

export async function resetPlan(): Promise<void> {
  await db.meta.delete(START_KEY)
  await db.meta.delete(PROGRESS_KEY)
  await db.meta.delete(DATES_KEY)
}

/** Which day of the plan today is, given when it was started. */
export function dayForDate(startISO: string, when = new Date()): number {
  const start = new Date(startISO + 'T00:00:00')
  const diff = Math.floor((when.getTime() - start.getTime()) / 86400000)
  return Math.max(1, diff + 1)
}

// ---------------------------------------------------------------------------
// Reading streak
//
// A day counts as read if anything was marked read on it. The current streak
// tolerates today not being done yet — it only breaks once a whole day has
// passed unread, so opening the app in the morning does not show a broken
// streak you have not actually broken.

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function shiftDay(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function getReadDates(): Promise<string[]> {
  const rec = await db.meta.get(DATES_KEY)
  try {
    return rec ? (JSON.parse(rec.value) as string[]) : []
  } catch {
    return []
  }
}

export async function recordReadToday(): Promise<string[]> {
  const dates = await getReadDates()
  const t = today()
  if (!dates.includes(t)) {
    dates.push(t)
    dates.sort()
    await db.meta.put({ key: DATES_KEY, value: JSON.stringify(dates) })
  }
  return dates
}

export interface Streak { current: number; longest: number; readToday: boolean; total: number }

export function computeStreak(dates: string[], now = today()): Streak {
  const set = new Set(dates)
  const readToday = set.has(now)

  // Count back from today, or from yesterday if today is not done yet.
  let cursor = readToday ? now : shiftDay(now, -1)
  let current = 0
  while (set.has(cursor)) { current++; cursor = shiftDay(cursor, -1) }

  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const d of [...set].sort()) {
    run = prev && shiftDay(prev, 1) === d ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = d
  }

  return { current, longest, readToday, total: set.size }
}

/** Mark a segment read and count today toward the streak. */
export async function markSegmentRead(id: string): Promise<{ done: Set<string>; dates: string[] }> {
  const done = await getCompleted()
  if (!done.has(id)) {
    done.add(id)
    await setCompleted(done)
  }
  const dates = await recordReadToday()
  return { done, dates }
}

export async function resetStreak(): Promise<void> {
  await db.meta.delete(DATES_KEY)
}
